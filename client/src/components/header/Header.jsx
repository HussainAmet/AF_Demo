import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { useEffect, useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../store/memberDetailsSlice";
import "./header.css";
import config from "../../config/config";

export default function Header() {
  const navigate = useNavigate();
  const [state, setState] = useState(false);
  const [memberData, setMemberData] = useState();

  const data = useSelector((state) => state.member.memberDetails);
  const dispatch = useDispatch();

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setState(open);
  };

  const logo = () => {
    dispatch(logout());
    localStorage.removeItem("phone");
    navigate("/login");
  };

  useEffect(() => {
    setMemberData(data);
  }, [data]);

  const list = () => (
    <Box
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        <Link
          className="text-decoration-none text-body-secondary"
          to="host/dashboard/profile"
        >
          <ListItem>
            <ListItemButton>
              <ListItemText>Home</ListItemText>
            </ListItemButton>
          </ListItem>
        </Link>
        <Link
          className="text-decoration-none text-body-secondary"
          to="host/members"
        >
          <ListItem>
            <ListItemButton>
              <ListItemText>All Members</ListItemText>
            </ListItemButton>
          </ListItem>
        </Link>
        <Link
          className="text-decoration-none text-body-secondary"
          to="host/update/add-savings"
        >
          <ListItem>
            <ListItemButton>
              <ListItemText>Add Saving</ListItemText>
            </ListItemButton>
          </ListItem>
        </Link>
        <Link
          className="text-decoration-none text-body-secondary"
          to="host/update/give-loan"
        >
          <ListItem>
            <ListItemButton>
              <ListItemText>Give Loan</ListItemText>
            </ListItemButton>
          </ListItem>
        </Link>
        <Link
          className="text-decoration-none text-body-secondary"
          to="host/update/add-loan-installment"
        >
          <ListItem>
            <ListItemButton>
              <ListItemText>Add Loan Installment</ListItemText>
            </ListItemButton>
          </ListItem>
        </Link>
      </List>
    </Box>
  );

  return (
    <>
      <Box sx={{ flexGrow: 1 }} className="mb-4">
        <AppBar position="static">
          <Toolbar style={{ backgroundColor: "var(--primary-300)" }}>
            {memberData?.auth?.data?.role.includes("host") ? (
              <div>
                <Button
                  onClick={toggleDrawer(true)}
                  sx={{ color: "white", minWidth: 0 }}
                >
                  <MenuIcon />
                </Button>
                <Drawer open={state} onClose={toggleDrawer(false)}>
                  {list()}
                </Drawer>
              </div>
            ) : (
              ""
            )}
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              {config.groupName}
            </Typography>
            <div className="d-flex">
              {memberData?.auth?.data?.role ? (
                <Button color="inherit" onClick={logo}>
                  Logout
                </Button>
              ) : (
                ""
              )}
            </div>
          </Toolbar>
        </AppBar>
      </Box>
    </>
  );
}
