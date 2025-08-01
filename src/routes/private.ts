import { Router, Request, Response } from 'express'
import { authenticateToken } from '@/middlewares/auth'
import { excelUpload, imageUpload } from '@/middlewares/upload'

import { EventController } from '@/controllers/event-controller'
import { UserController } from '@/controllers/user-controller'
import EventTypeController from '@/controllers/event-type-controller'
import PlayerController from '@/controllers/player-controller'
import VolunteerController from '@/controllers/volunteer-controller'
import TaskController from '@/controllers/task-controller'

const router = Router()
router.use(authenticateToken)

const eventController = new EventController()
const userController = new UserController()
const eventTypeController = new EventTypeController()
const playerController = new PlayerController()
const volunteerController = new VolunteerController()
const taskController = new TaskController()

// User routes
// router.get('/users', async (req: Request, res: Response) => {
//   await userController.getUserByEmail(req, res)
// })

// // Upload routes
// router.post('/upload', upload.single('image'), async (req: Request, res: Response) => {
//   await uploadController.uploadImage(req, res)
// })

router.get('/events', async (req: Request, res: Response) => {
  await eventController.index(req, res)
})
router.get('/events/:id', async (req: Request, res: Response) => {
  await eventController.getEventById(req, res)
})
router.put('/events/:id', async (req: Request, res: Response) => {
  await eventController.updateEvent(req, res)
})
router.post('/events', async (req: Request, res: Response) => {
  await eventController.createEvent(req, res)
})
router.get('/events/:id/players', async (req: Request, res: Response) => {
  await playerController.getPlayerByEvent(req, res)
})

router.get('/eventTypes', async (req: Request, res: Response) => {
  await eventTypeController.getAll(req, res)
})
router.post('/eventTypes', async (req: Request, res: Response) => {
  await eventTypeController.create(req, res)
})
router.get('/me', async (req: Request, res: Response) => {
  await userController.me(req, res)
})

router.post('/players', imageUpload.single('avatar'), async (req: Request, res: Response) => {
  await playerController.createPlayer(req, res)
})
router.post('/players/upload-import', excelUpload.single('file'), async (req: Request, res: Response) => {
  await playerController.uploadImportPlayers(req, res)
})
router.post('/players/validate-import', async (req: Request, res: Response) => {
  await playerController.validatePlayers(req, res)
})
router.post('/players/import', async (req: Request, res: Response) => {
  await playerController.importPlayers(req, res)
})
router.get('/players', async (req: Request, res: Response) => {
  await playerController.index(req, res)
})
router.get('/players/:id', async (req: Request, res: Response) => {
  await playerController.getPlayerById(req, res)
})
router.put('/players/:id', imageUpload.single('avatar'), async (req: Request, res: Response) => {
  await playerController.updatePlayer(req, res)
})
router.get('/players/:id/notes', async (req: Request, res: Response) => {
  await playerController.getNotes(req, res)
})
router.post('/players/:id/notes', async (req: Request, res: Response) => {
  await playerController.updateNotes(req, res)
})
router.get('/players/:id/goals', async (req: Request, res: Response) => {
  await playerController.getGoals(req, res)
})
router.post('/players/:id/goals', async (req: Request, res: Response) => {
  await playerController.updateGoals(req, res)
})

router.get('/positions', async (req: Request, res: Response) => {
  await playerController.getPositions(req, res)
})

router.get('/tasks', async (req: Request, res: Response) => {
  await taskController.index(req, res)
})
router.post('/tasks', async (req: Request, res: Response) => {
  await taskController.createTask(req, res)
})
router.put('/tasks/:id', async (req: Request, res: Response) => {
  await taskController.updateTask(req, res)
})
router.get('/priorities', async (req: Request, res: Response) => {
  await taskController.getPriorities(req, res)
})

export default router 