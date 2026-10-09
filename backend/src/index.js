import { config } from './config.js'
import connectDB from './db/connect.db.js'
import app from './app.js'

await connectDB()

app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
})
