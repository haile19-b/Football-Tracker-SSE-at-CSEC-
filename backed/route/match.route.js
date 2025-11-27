import express from 'express';
import { addMatch, 
    addMatchEvent,
     ChangeStatusOfMatch, 
     getMatchById, 
     getMatches, 
     StartTheMatch, 
     streamMatch, 
     streamMatches, 
     updateScore
    } from '../controller/match.controller.js';


const router = express.Router();

router.get("/",getMatches);
router.post('/add', addMatch);
router.post('/change-status', ChangeStatusOfMatch);
router.post('/start', StartTheMatch);
router.post('/add-event', addMatchEvent);
router.get('/stream', streamMatches); // For match list
router.get('/stream/:matchId', streamMatch); // For specific match
router.get('/:id', getMatchById);
router.post('/update-score', updateScore);


export default router;