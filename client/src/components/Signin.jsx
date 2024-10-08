import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useDispatch } from "react-redux";
import {
  getAllMembersDetails,
  getMemberDetails,
  login,
} from "../store/memberDetailsSlice";
import config from "../config/config";
import CircularProgress from "@mui/material/CircularProgress";
import { Typography } from "@mui/material";
import { resetTimer } from "../hooks/reloadTimout";

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

export default function Signin() {
  const [progress, setProgress] = useState(0);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState();
  const [password, setPassword] = useState();

  const logIn = async (data) => {
    setLoading(true);
    setError("");
    try {
      const userData = await axios.post(
        `${config.poductionUrl}${config.requestBaseUrl}login`,
        { phone: data.number }
      );
      if (userData.data) {
        dispatch(login());
        dispatch(getMemberDetails({ member: userData.data.member.data }));
        const role = userData.data.member.data.auth.data.role;
        if (role.includes("host")) {
          dispatch(getAllMembersDetails({ allMembers: userData.data.members }));
          localStorage.setItem(
            "phone",
            userData.data.member.data.auth.data.phone * 2 + 18
          );
          navigate("/host/dashboard/profile");
        } else if (role.includes("member")) {
          localStorage.setItem(
            "phone",
            userData.data.member.data.auth.data.phone * 2 + 18
          );
          navigate("/member/dashboard/profile");
        } else {
          setLoading(false);
          setError("Phone number not found");
        }
      } else {
        setLoading(false);
        setError("Phone number not found");
      }
    } catch (error) {
      setLoading(false);
      if (error?.response?.status === 404) setError("Member Not Found");
      else setError("An error occurred");
    }
    setTimeout(() => {
      setError("");
    }, 3000);
    resetTimer();
  };

  useEffect(() => {
    const data = { number: (localStorage.phone - 18) / 2 };
    if (data.number) {
      logIn(data);
      setPhoneNumber(data.number)
    }
  }, [localStorage]);

  useEffect(() => {
    if (loading) {
      const timer = setInterval(() => {
        setProgress((prevProgress) =>
          prevProgress >= 100 ? 0 : prevProgress + 1
        );
      }, 1000);
      return () => {
        clearInterval(timer);
      };
    }
  }, [loading]);

  return (
    <>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* <Box sx={{
            backgroundColor: 'lightGreen',
            fontSize: 14,
            borderRadius: 2,
            padding: 1,
            color: 'green',
            fontFamily: "monospace",
          }}>
            <p style={{margin: 1}}>Use These Sample Phone Numbers for Signin</p>
            <p style={{margin: 1}}><span style={{fontWeight: 600,}}>Admin</span> : 1234567890</p>
            <p style={{margin: 1}}><span style={{fontWeight: 600,}}>Host</span> : 1234512345,</p>
            <p style={{margin: 1}}><span style={{fontWeight: 600,}}>Member</span> : 6789067890</p>
          </Box> */}
          {error && <span className="text-danger mt-1 ">{error}</span>}
          <Box component="form" onSubmit={handleSubmit(logIn)} sx={{ mt: 1 }}>
            <TextField
              type="number"
              onInput={(e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, "");
              }}
              margin="normal"
              value={phoneNumber}
              autoFocus={true}
              required
              fullWidth
              id="phone"
              label="Phone Number"
              name="phone"
              autoComplete="phone"
              onWheel={(e) => e.target.blur()}
              {...register("number", {
                required: true,
                maxLength: { value: 10, message: "max" },
                minLength: { value: 10, message: "min" },
              })}
            />
            {errors.number &&
              (errors.number.type === "minLength" ||
                errors.number.type === "maxLength") && (
                <span className="text-danger mt-1">Invalid Number</span>
              )}
            <TextField
              type="password"
              margin="normal"
              value={password}
              // required
              fullWidth
              id="password"
              label="Password"
              name="password"
              // {...register("password", {
              //   required: true,
              // })}
            />
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
              disabled={loading}
              className="py-3"
            >
              {loading ? (
                <CircularProgressWithLabel
                  value={progress}
                  style={{ color: "var(--primary-300)" }}
                />
              ) : (
                "Sign In"
              )}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              sx={{
                mb: 2,
                color: "var(--primary-300)",
                borderColor: "var(--primary-300)",
                "&:hover": { backgroundColor: "var(--primary-200)", color: "white", borderColor: "white" },
                "&:disabled": { backgroundColor: "var(--secondary)" },
              }}
              disabled={loading}
              className="py-3"
              onClick={() => {logIn({number: 1234567890})}}
            >
              {loading ? (
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
      </Container>
    </>
  );
}
