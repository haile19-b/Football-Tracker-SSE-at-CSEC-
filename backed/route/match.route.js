import express from 'express';
import { addMatch, 
    addMatchEvent,
     ChangeStatusOfMatch, 
     StartTheMatch, 
     streamMatch, 
     streamMatches 
    } from '../controller/match.controller.js';


const router = express.Router();

router.post('/add', addMatch);
router.post('/change-status', ChangeStatusOfMatch);
router.post('/start', StartTheMatch);
router.post('/add-event', addMatchEvent);
router.get('/stream', streamMatches); // For match list
router.get('/stream/:matchId', streamMatch); // For specific match

export default router;