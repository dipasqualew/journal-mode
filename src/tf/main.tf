terraform {
  backend "gcs" {
    bucket = "journal-mode-prod-state"
    prefix = "/state"
  }
}

provider "google" {
  project = "journal-mode-prod"
  region  = "europe-west2"
}

variable "GCP_FUNCTION_API_KEY" {
  type = string
}

# Create a Google Cloud Storage bucket for the function's code
resource "google_storage_bucket" "function_code_bucket" {
  name          = "journal-mode-prod--funcs"
  location      = "europe-west2"
  force_destroy = true # Allows the bucket to be destroyed even if it contains objects. Use with caution.

  versioning {
    enabled = false
  }
}

data "archive_file" "function_zip" {
  type        = "zip"
  source_dir  = "../../.cache/build"
  output_path = "../../.cache/function.zip"
}

resource "google_storage_bucket_object" "function_zip" {
  name   = join("", ["function__", data.archive_file.function_zip.output_md5, ".zip"])
  bucket = google_storage_bucket.function_code_bucket.name
  source = data.archive_file.function_zip.output_path
}


resource "google_firestore_database" "journal_firestore" {
  project     = "journal-mode-prod"
  name        = "(default)"
  location_id = "europe-west2"
  type        = "FIRESTORE_NATIVE"
}


resource "google_cloudfunctions_function" "http_request_function" {
  name        = "http-request-function"
  description = "A function that makes an HTTP GET request to google.com"
  runtime     = "nodejs14"

  available_memory_mb   = 256
  source_archive_bucket = google_storage_bucket.function_code_bucket.name
  source_archive_object = google_storage_bucket_object.function_zip.name

  entry_point = "httpRequestFunction"

  trigger_http = true

  labels = {
    function        = "httprequest"
    deployment-tool = "terraform"
  }

  environment_variables = {
    GCP_PROJECT_ID       = "journal-mode-prod"
    GCP_FUNCTION_API_KEY = var.GCP_FUNCTION_API_KEY
    ZIP_HASH             = data.archive_file.function_zip.output_md5
  }

  depends_on = [
    data.archive_file.function_zip,
    google_storage_bucket_object.function_zip,
  ]
}

resource "google_cloudfunctions_function" "write_journal" {
  name        = "write_journal"
  description = "Writes a journal entry"
  runtime     = "nodejs18"

  available_memory_mb   = 256
  source_archive_bucket = google_storage_bucket.function_code_bucket.name
  source_archive_object = google_storage_bucket_object.function_zip.name

  entry_point = "writeJournalEntry"

  trigger_http = true

  labels = {
    function        = "writejournalentry"
    deployment-tool = "terraform"
  }

  environment_variables = {
    GCP_PROJECT_ID       = "journal-mode-prod"
    GCP_FUNCTION_API_KEY = var.GCP_FUNCTION_API_KEY
    ZIP_HASH             = data.archive_file.function_zip.output_md5
  }

  depends_on = [
    data.archive_file.function_zip,
    google_storage_bucket_object.function_zip,
  ]
}


resource "google_cloudfunctions_function_iam_member" "public_invoker" {
  project        = "journal-mode-prod"
  region         = "europe-west2"
  cloud_function = google_cloudfunctions_function.http_request_function.name

  role   = "roles/cloudfunctions.invoker"
  member = "allUsers"
}

resource "google_cloudfunctions_function_iam_member" "write_journal_public_invoker" {
  project        = "journal-mode-prod"
  region         = "europe-west2"
  cloud_function = google_cloudfunctions_function.write_journal.name

  role   = "roles/cloudfunctions.invoker"
  member = "allUsers"
}


resource "google_project_iam_member" "function_firestore_access" {
  project = "journal-mode-prod"
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_cloudfunctions_function.http_request_function.service_account_email}"
}

resource "google_project_iam_member" "write_journal_firestore_access" {
  project = "journal-mode-prod"
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_cloudfunctions_function.write_journal.service_account_email}"
}



output "function_invocation_url" {
  value       = google_cloudfunctions_function.http_request_function.https_trigger_url
  description = "The URL used to invoke the function"
}

output "write_journal_invocation_url" {
  value       = google_cloudfunctions_function.write_journal.https_trigger_url
  description = "The URL used to invoke write_journal"
}
