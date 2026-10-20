// Stand-in backend for server-side calls made while rendering (auth, layouts).
// Browser calls never reach it: specs answer those with page.route fixtures.
import { createServer } from 'node:http';

const port = Number(process.argv[2] ?? 4010);

const json = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};

createServer((req, res) => {
  if (req.url?.startsWith('/api/v1/users/me')) {
    return json(res, 200, { success: true, data: { uuid: '00000000-0000-4000-8000-000000000001', user_domain: ['instructor'] } });
  }
  json(res, 200, { success: true, data: null, message: 'e2e mock' });
}).listen(port, () => process.stdout.write(`e2e mock API on ${port}\n`));
