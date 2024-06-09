import "dotenv/config";

import express from "express";
import session from "express-session";
import cors from "cors";

import pg from "pg";

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

app.use(cors());

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

app.get("/login", (req, res) => {
  res.json(req.user);
});

app.get("/logout", (req: any, res: any) => {
  req.logout((err: any) => {
    if (err) res.send(err);
    res.send("user logged out");
  });
});

app.get("/auth/google", passport.authenticate("google", { scope: ["email", "profile"] }));

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", {
    successRedirect: "http://localhost:3000/",
    failureRedirect: "http://localhost:3000/login",
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
  req.user ? next() : res.statusCode(401);
}
