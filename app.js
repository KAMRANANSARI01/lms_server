import  express  from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import morgan from "morgan";
import userRoutes from "./routes/userRoutes.js"
import courseRoutes from './routes/courseRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import miscRoutes from './routes/miscelleneousRoutes.js'
import errorMiddleware from "./middleware/error.middleware.js";
config();

const app = express();
app.use(express.json())
app.use(express.urlencoded({extended:true}))//its used to get qury param from encoded or encripted url.
// app.use(cors({
//     origin:[process.env.FRONTEND_URL],
//     Credential:true
// }))
app.use(cors({
    origin: 'http://localhost:5173', // Specify the allowed origin directly
    credentials: true,
  }));
app.use(cookieParser())
app.use(morgan('dev'))
// Server Status Check Route
app.get('/ping', (_req, res) => {
    res.send('Pong');
  });
app.use("/api/v1/user",userRoutes)//for user homePage
app.use("/api/v1/course",courseRoutes)//for course homepage
app.use("/api/v1/payment",paymentRoutes)
app.use('/api/v1',miscRoutes)
// app.use("/",(req,res)=>{
//     res.send("hello world")
// })
app.all("*",(req,res)=>{
    res.status(404).send("OOPS!! Page not found")
})

app.use(errorMiddleware);

export default app;