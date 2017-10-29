FROM armhf/node:7.8-slim

LABEL maintainer "thom.nocon@gmail.com"
LABEL version "0.1.0"

WORKDIR dist/device-engine

COPY lib lib
COPY node_modules node_modules

CMD ["node", "lib/index.js"]