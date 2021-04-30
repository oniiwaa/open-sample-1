import * as express from 'express';
import * as history from 'connect-history-api-fallback';
import * as cors from 'cors';

import goods from './router/goods';
import user from './router/user';

const app = express();

app.use(history());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(express.static('./front'));
app.use('/user', user);
app.use('/goods', goods);
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found API.' });
});
app.listen(3000);
export default app;