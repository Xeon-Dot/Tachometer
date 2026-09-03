FROM oven/bun:1-alpine
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY package.json tsconfig.json ./
COPY src ./src
COPY public ./public
ENV NODE_ENV=production
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD bun -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/health').then(r=>r.json()).then(j=>{if(!j.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["bun", "run", "src/index.ts"]
