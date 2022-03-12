var express = require("express");
var router = express.Router();
const User = require("../models/user.model");
const nodemailer = require("nodemailer");

const {
  EMAIL_USERNAME,
  EMAIL_PASSWORD,
} = require("../env");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: EMAIL_USERNAME,
    pass: EMAIL_PASSWORD,
  },
});

router.post("/register", async function (req, res) {
  try {
    let { email } = req.body;
    const existingUser = await User.findOne({ email }).exec();
    if (!existingUser) {
      const user = await new User(req.body);
      const ack = await user.save();
      if (ack) res.status(200).send({ message: "Registration Successful!" });
      else res.status(202).send({ message: "Something is wrong!" });
    }
    else{
      res.status(201).send({message:"Email already present please login"})
    }
  } catch (err) {
    res.send(err.message);
  }
});

router.post("/reset-send", async (req, res) => {
  // Check if the body has an email
  let { email } = req.body;
  if (!email) {
    return res
      .status(202)
      .send({ message: "User is not registered please register!" });
  }

  try {
    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) {
      //Generate a verification token
      const verificationToken = (Math.random() + 1).toString(36).substring(3);
      const ack = await User.findOneAndUpdate(
        { email },
        {
          randomstring: verificationToken,
        }
      );
      if (ack) {
        // Email the user a unique verification link
        const url = `https://password-reset-flow-frontend.netlify.app/verify/${email}/${verificationToken}`;
        transporter.sendMail({
          to: email,
          subject: "Verify Account to change password!",
          html: `Click <a href = '${url}'>here</a> to reset password!`,
        });

        res.status(200).send({
          message: `Sent a verification email to ${email}! In case if you dont find the mail please check spam folder too`,
        });
      }
    }
    else
    {
      //Email not in db
      res.status(201).json({message:"Email not present please register!"});
    }
  } catch (err) {
    res.status(500);
    res.send(err.message);
  }
});



router.post("/change", async (req, res) => {
  try {
    const { password } = req.body;
    const { randomstring, email } = req.headers;
    if (password === null || email === null || randomstring === null)
      res.status(300).send({ message: "Parameters missing!" });
    else {
      let ack = await User.findOne({ email, randomstring }).exec();
      if (!ack) res.status(300).send({message:"Something went wrong!"});
      else {
        let lastRes = await User.findOneAndUpdate(
          { randomstring, email },
          {$set:{ password }}
        ).exec();
        if (lastRes) {
          res.status(200).send({message:"Password reset successful!"});
        }
        else res.redirect("/");
      }
    }
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

module.exports = router;
