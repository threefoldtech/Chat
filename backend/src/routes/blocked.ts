import { Router } from 'express';
import { getBlocklist, persistBlocklist } from '../service/dataService';

const router = Router();

router.get('/', (req, res) => {
    res.json(getBlocklist());
});

router.delete('/:name', (req, res) => {
    persistBlocklist(getBlocklist().filter(b => b != req.params.name));
    res.json({ status: 'success' });
});

export default router;
