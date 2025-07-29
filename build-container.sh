#!/bin/bash
podman buildx build --platform linux/amd64,linux/arm64 -f dockerfile -t receptionist-bot