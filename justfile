set dotenv-load
set positional-arguments

alias tf := terraform

@terraform *args='':
    cd src/tf && terraform $@

@build:
    ./build.sh
