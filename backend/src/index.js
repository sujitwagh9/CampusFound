import express from 'express'
import dotenv from 'dotenv'
import connectDB from './db/connect.db.js'
import cors from 'cors'
import userRoutes from './routes/user.route.js' 
import itemRoutes from './routes/item.route.js'
import protectedRoute from './routes/protected.routes.js'
import errorHandlingMiddleware from './middlewares/errorHandler.middleware.js'
import adminRoutes from './routes/admin.route.js'
dotenv.config()
connectDB()

const app = express()
const PORT = process.env.PORT || 8080


app.use(cors())
app.use(express.json())

app.use('/api', userRoutes);
app.use('/api', itemRoutes);
app.use('/api', protectedRoute);
app.use('/api/admin', adminRoutes);




app.listen(PORT,()=>{
    console.log(`server starting on ${PORT}`);
})

app.use(errorHandlingMiddleware);