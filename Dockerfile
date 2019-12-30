FROM alpine:latest as base
RUN apk --no-cache --update upgrade && apk --no-cache add ca-certificates && apk add --no-cache lm_sensors coreutils grep gawk
