import "dotenv/config";

import express from "express";
import cors from "cors";

import pg from "pg";

import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";

const port = 4598;
const app = express();

app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

const db = new pg.Client({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});
db.connect();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/get_candidates", (req, res) => {
  db.query("SELECT * FROM candidates", (err: any, data: any) => {
    if (err) {
      console.log(err);
      res.sendStatus(500);
    } else {
      res.json(data.rows);
    }
  });
});

app.get("/login", isLoggedIn, (req, res) => {
  res.json(req.user);
});

app.get("/logout", (req: any, res: any) => {
  req.logout((err: any) => {
    console.log("user logout");
    if (err) res.send(err);
    res.send("user logged out");
  });
});

app.get("/auth/google", passport.authenticate("google", { scope: ["email", "profile"] }));

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", {
    successRedirect: process.env.FRONTEND_URL,
    failureRedirect: process.env.FRONTEND_URL + "/login",
  })
);

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: "http://localhost:4598/auth/google/secrets",
      passReqToCallback: true,
    },
    function (request: any, accessToken: any, refreshToken: any, profile: any, done: any) {
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});

function isLoggedIn(req: any, res: any, next: any) {
  req.user ? next() : res.status(401).json("Not authorized");
}
