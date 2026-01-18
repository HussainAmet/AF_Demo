import { Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import axios from "axios";
import PropTypes from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import config from "../config/config";
import {
  auth,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "../firebase/firebase";
import {
  getAllMembersDetails,
  getMemberDetails,
  login,
} from "../store/memberDetailsSlice";

function CircularProgressWithLabel(props) {
  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <CircularProgress {...props} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: "absolute",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="caption" component="div" color="text.secondary">
          {`${Math.round(props.value)}%`}
        </Typography>
      </Box>
    </Box>
  );
}

CircularProgressWithLabel.propTypes = {
  value: PropTypes.number.isRequired,
};

export default function Signin() {
  const [progress, setProgress] = useState(0);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [btnText, setBtnText] = useState("Send OTP");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [message, setMessage] = useState("");
  const [recaptchaRendered, setRecaptchaRendered] = useState(false);

  const recaptchaVerifierRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    // Set up reCAPTCHA verifier only once when the component mounts
    if (!recaptchaVerifierRef.current && !recaptchaRendered) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible", // 'normal', 'compact', or 'invisible'
          callback: () => {
            // reCAPTCHA solved, enable the send code button
            setMessage(
              "reCAPTCHA verified. You can now send the verification code.",
            );
          },
          "expired-callback": () => {
            // Response expired. Ask user to solve reCAPTCHA again.
            setMessage("reCAPTCHA expired. Please re-verify.");
            // You might want to re-render reCAPTCHA here
            if (recaptchaVerifierRef.current) {
              recaptchaVerifierRef.current.render();
            }
          },
        },
      );

      recaptchaVerifierRef.current
        .render()
        .then((widgetId) => {
          setRecaptchaRendered(true);
          console.log("reCAPTCHA rendered with widget ID:", widgetId);
        })
        .catch((error) => {
          console.error("Error rendering reCAPTCHA:", error);
          setMessage(`Error rendering reCAPTCHA: ${error.message}`);
        });
    }

    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setMessage(`Currently signed in as: ${currentUser.phoneNumber}`);
      } else {
        setMessage("No user signed in.");
      }
    });

    // Cleanup subscription on component unmount
    return () => {
      unsubscribe();
      // Optional: Reset reCAPTCHA on unmount if needed
      if (recaptchaVerifierRef.current && recaptchaRendered) {
        recaptchaVerifierRef.current.clear();
        setRecaptchaRendered(false);
      }
    };
  }, [recaptchaRendered]);

  const handleSendCode = async (data) => {
    setLoading(true);
    setMessage("Sending verification code...");
    try {
      if (!recaptchaVerifierRef.current) {
        setMessage("reCAPTCHA not initialized.");
        setLoading(false);
        return;
      }
      const result = await signInWithPhoneNumber(
        auth,
        "+91" + data.number,
        recaptchaVerifierRef.current,
      );
      setConfirmationResult(result);
      setMessage("Verification code sent! Please enter it.");
      setOtpSent(true);
      setBtnText("Verify Code");
    } catch (error) {
      console.error("Error sending verification code:", error);
      setMessage(`Error sending code: ${error.message}`);
    }
    setLoading(false);
  };

  const handleVerifyCode = async (data) => {
    setLoading(true);
    setMessage("Verifying code...");
    try {
      if (!confirmationResult) {
        setMessage("No verification code was sent yet.");
        setLoading(false);
        return;
      }
      await confirmationResult.confirm(data.otp);
      // User is now signed in. onAuthStateChanged listener will update `user` state.
      setMessage("Phone number successfully verified.");
      setOtp("");
      setPhoneNumber("");
      setOtpVerified(true);
      setBtnText("Log In");
      logIn({ number: data.number });
    } catch (error) {
      console.error("Error verifying code:", error);
      setMessage(`Error verifying code: ${error.message}`);
    }
    setLoading(false);
  };

  const logIn = useCallback(
    async (data, isGuest = false) => {
      setError("");
      isGuest ? setGuestLoading(true) : setLoading(true);
      try {
        const userData = await axios.post(
          `${config.poductionUrl}${config.requestBaseUrl}login`,
          { phone: data.number },
        );

        if (userData.data) {
          dispatch(login());
          dispatch(getMemberDetails({ member: userData.data.member.data }));
          const role = userData.data.member.data.auth.data.role;
          if (role.includes("host")) {
            dispatch(
              getAllMembersDetails({ allMembers: userData.data.members }),
            );
            localStorage.setItem(
              "phone",
              userData.data.member.data.auth.data.phone * 2 + 18,
            );
            navigate("/host/dashboard/profile");
          } else if (role.includes("member")) {
            localStorage.setItem(
              "phone",
              userData.data.member.data.auth.data.phone * 2 + 18,
            );
            navigate("/member/dashboard/profile");
          } else {
            isGuest ? setGuestLoading(false) : setLoading(false);
            throw new Error("Member Not Found");
          }
        } else {
          isGuest ? setGuestLoading(false) : setLoading(false);
          throw new Error("Member Not Found");
        }
      } catch (error) {
        isGuest ? setGuestLoading(false) : setLoading(false);
        console.error("Error in logIn:", error);
        if (error?.response?.data === "Your number is blocked") {
          setError("Your number is blocked");
        } else if (error?.response?.data === "Not Found") {
          setError("Member not found");
        } else {
          setError("An error occurred.");
        }
        localStorage.removeItem("phone");
      }
      setTimeout(() => {
        setError("");
      }, 3000);
      isGuest ? setGuestLoading(false) : setLoading(false);
    },
    [dispatch, navigate],
  );

  useEffect(() => {
    const data = { number: (localStorage.phone - 18) / 2 };
    if (data.number) {
      logIn(data);
    }
  }, [logIn]);

  useEffect(() => {
    if (loading || guestLoading) {
      const timer = setInterval(() => {
        setProgress((prevProgress) =>
          prevProgress >= 100 ? 0 : prevProgress + 1,
        );
      }, 1000);
      return () => {
        clearInterval(timer);
      };
    }
  }, [loading, guestLoading]);

  const submitHandler = (data) => {
    if (otpSent) {
      if (otpVerified) {
        return logIn(data);
      } else {
        return handleVerifyCode(data);
      }
    } else {
      return handleSendCode(data);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit(submitHandler)}
          sx={{ mt: 1, width: "100%" }}
        >
          <TextField
            type="number"
            onInput={(e) => {
              e.target.value = e.target.value.replaceAll(/\D/g, "");
            }}
            margin="normal"
            required
            fullWidth
            id="phone"
            label="Phone Number"
            name="phone"
            autoComplete="phone"
            onWheel={(e) => e.target.blur()}
            {...register("number", {
              required: true,
              value: phoneNumber,
              maxLength: { value: 10, message: "max" },
              minLength: { value: 10, message: "min" },
            })}
          />
          <div className="d-flex flex-column " style={{ width: "310" }}>
            {error && <span className="text-danger mt-1 ">{error}</span>}
            {errors.number &&
              (errors.number.type === "minLength" ||
                errors.number.type === "maxLength") && (
                <span className="text-danger mt-1">Invalid Number</span>
              )}
          </div>
          {otpSent && (
            <>
              <TextField
                type="text"
                onInput={(e) => {
                  e.target.value = e.target.value.replaceAll(/\D/g, "");
                }}
                margin="normal"
                required
                fullWidth
                id="otp"
                label="Enter OTP"
                name="otp"
                autoComplete="otp"
                onWheel={(e) => e.target.blur()}
                {...register("otp", {
                  required: true,
                  value: otp,
                  maxLength: { value: 6, message: "max" },
                  minLength: { value: 6, message: "min" },
                })}
              />
              <div className="d-flex flex-column " style={{ width: "310" }}>
                {error && <span className="text-danger mt-1 ">{error}</span>}
                {errors.otp &&
                  (errors.otp.type === "minLength" ||
                    errors.otp.type === "maxLength") && (
                    <span className="text-danger mt-1">Invalid OTP</span>
                  )}
                {message && (
                  <p
                    style={{
                      marginTop: "20px",
                      color: message.startsWith("Error") ? "red" : "green",
                    }}
                  >
                    {message}
                  </p>
                )}
              </div>
            </>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              mb: 2,
              backgroundColor: "var(--primary-300)",
              "&:hover": { backgroundColor: "var(--primary-200)" },
              "&:disabled": { backgroundColor: "var(--secondary)" },
            }}
            className="py-3"
            disabled={loading}
          >
            {loading ? (
              <CircularProgressWithLabel
                value={progress}
                style={{ color: "var(--primary-300)" }}
              />
            ) : (
              btnText
            )}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            sx={{
              mb: 2,
              color: "var(--primary-300)",
              borderColor: "var(--primary-300)",
              "&:hover": {
                backgroundColor: "var(--primary-200)",
                color: "white",
                borderColor: "white",
              },
              "&:disabled": { backgroundColor: "var(--secondary)" },
            }}
            disabled={guestLoading}
            className="py-3"
            onClick={() => {
              logIn({ number: 9988776655 }, true);
            }}
          >
            {guestLoading ? (
              <CircularProgressWithLabel
                value={progress}
                style={{ color: "var(--primary-300)" }}
              />
            ) : (
              "Sign In as a Guest"
            )}
          </Button>
        </Box>
      </Box>
      <div id="recaptcha-container" style={{ marginBottom: "15px" }}></div>
    </Container>
  );
}
