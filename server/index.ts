import 'dotenv/config';
import { createApp } from './app';
import { createStore } from './store';
const store = createStore();
const server = createApp(store).listen(
  Number(process.env.PORT ?? 3001),
  '127.0.0.1',
  () =>
    console.log(
      'Takeverse API: http://127.0.0.1:' + (process.env.PORT ?? 3001),
    ),
);
function shutdown() {
  server.close(() => {
    store.db.close();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
