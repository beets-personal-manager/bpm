FROM ubuntu:22.04 AS builder-base

RUN apt update
RUN DEBIAN_FRONTEND=noninteractive apt install -y npm wget git gcc curl

RUN wget -P /tmp "https://go.dev/dl/go1.24.0.linux-amd64.tar.gz"

RUN tar -C /usr/local -xzf "/tmp/go1.24.0.linux-amd64.tar.gz"
RUN rm "/tmp/go1.24.0.linux-amd64.tar.gz"

ENV GOPATH /go
ENV PATH $GOPATH/bin:/usr/local/go/bin:$PATH
RUN mkdir -p "$GOPATH/src" "$GOPATH/bin" && chmod -R 777 "$GOPATH"

# Use bash for the shell
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Create a script file sourced by both interactive and non-interactive bash shells
ENV BASH_ENV /root/.bash_env
RUN touch "${BASH_ENV}"
RUN echo '. "${BASH_ENV}"' >> ~/.bashrc

# Download and install nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | PROFILE="${BASH_ENV}" bash
RUN echo node > .nvmrc
RUN nvm install

RUN nvm install 22
RUN nvm use 22

FROM builder-base AS builder

WORKDIR /app/bpm
COPY . .

WORKDIR /app/bpm/web
RUN npm i

WORKDIR /app/bpm
RUN go generate ./...
RUN go build -o /bpm github.com/beets-personal-manager/bpm

FROM ubuntu:22.04 AS beets-base

RUN apt update
RUN DEBIAN_FRONTEND=noninteractive apt install -y \
                pipx \
                ffmpeg \
                libchromaprint-tools \
                python3-gi \
                libgstreamer1.0-0 \
                gstreamer1.0-plugins-bad \
                gstreamer1.0-plugins-good \
                gstreamer1.0-plugins-ugly
RUN apt install -y mp3gain

RUN pipx install beets
# Beets launch command
ENV BEET_CMD=/root/.local/bin/beet

FROM beets-base as beets-plugins-base

RUN pipx inject beets pyacoustid
RUN pipx inject beets python3-discogs-client
RUN pipx inject beets requests
RUN pipx inject beets pylast
RUN pipx inject beets flask
RUN pipx inject beets flask-cors
RUN pipx inject beets beets-artistcountry
RUN pipx inject beets beetcamp

FROM beets-plugins-base AS bpm

LABEL org.opencontainers.image.source=https://github.com/beets-personal-manager/bpm
LABEL org.opencontainers.image.description="BPM Runner"
LABEL org.opencontainers.image.licenses=MIT

RUN mkdir -p /config /import /library /logs
# BEETSHOME
VOLUME ["/config"]
# Incoming music
VOLUME ["/import"]
# Music library
VOLUME ["/library"]
# Import logs
VOLUME ["/logs"]

EXPOSE 23387

WORKDIR /
COPY --from=builder /bpm bpm
CMD /bpm server