import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import {
  AboutUs,
  AddMember,
  AuthLayout,
  Details,
  GetInTouch,
  Host,
  Member,
  MemberProfile,
  Members,
  Profile,
  Signin,
  UpdateDetails,
  UserDashboard,
} from "./components";
import store from "./store/store.js";

const router = createBrowserRouter([
  // {
  //   path: "/test-otp",
  //   element: (
  //     <TestForOTP />
  //   )
  // },
  {
    path: "/about-us",
    element: <AboutUs />,
  },
  {
    path: "/get-in-touch",
    element: <GetInTouch />,
  },
  {
    path: "/",
    element: (
      <AuthLayout>
        <App />
      </AuthLayout>
    ),
    children: [
      {
        path: "/login",
        element: (
          <AuthLayout>
            <Signin />
          </AuthLayout>
        ),
      },
      {
        path: "host",
        element: (
          <AuthLayout>
            <Host />
          </AuthLayout>
        ),
        children: [
          {
            path: "dashboard",
            element: <UserDashboard />,
            children: [
              {
                path: "profile",
                element: <Profile />,
              },
              {
                path: "details/:of",
                element: <Details />,
              },
            ],
          },
          {
            path: "members",
            element: <Members />,
            children: [
              {
                path: "add-member",
                element: <AddMember />,
              },
            ],
          },
          {
            path: "update/:what",
            element: <UpdateDetails />,
          },
        ],
      },
      {
        path: "member",
        element: <Member />,
        children: [
          {
            path: "dashboard",
            element: <UserDashboard />,
            children: [
              {
                path: "profile",
                element: <Profile />,
              },
              {
                path: "details/:of",
                element: <Details />,
              },
            ],
          },
        ],
      },
      {
        path: "/member-profile/:id",
        element: (
          <AuthLayout>
            <MemberProfile />
          </AuthLayout>
        ),
        children: [
          {
            path: "dashboard",
            element: <UserDashboard />,
            children: [
              {
                path: "profile",
                element: <Profile />,
              },
              {
                path: "details/:of",
                element: <Details />,
              },
            ],
          },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router}></RouterProvider>
    </Provider>
  </StrictMode>,
);
