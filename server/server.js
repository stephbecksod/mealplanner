const express = require('express')
const cors = require('cors')
require('dotenv').config()

const mealsRouter = require('./routes/meals')
const beveragesRouter = require('./routes/beverages')
const groceryRouter = require('./routes/grocery')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.use('/api/meals', mealsRouter)
app.use('/api/beverages', beveragesRouter)
app.use('/api/grocery', groceryRouter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Meal Planner API is running' })
})

app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  })
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`API available at http://localhost:${PORT}/api`)
})
