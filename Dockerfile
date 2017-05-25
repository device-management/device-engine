FROM armhf/node:7.8-slim

LABEL maintainer "thom.nocon@gmail.com"

WORKDIR dist/device-engine

COPY lib lib
COPY node_modules node_modules

CMD ["node", "lib/index.js"]