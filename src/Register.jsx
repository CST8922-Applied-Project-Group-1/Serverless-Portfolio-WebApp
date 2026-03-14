import React, { useState } from "react";
import "./Register.css";

function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    month: "",
    day: "",
    year: ""
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.username ||
      !formData.email ||
      !formData.password
    ) {
      return "Please fill in all required fields.";
    }

    if (!formData.email.includes("@")) {
      return "Email must contain @.";
    }

    if (formData.password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    return "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    alert("Registration successful!");
  };

  const handleBack = () => {
    alert("Back to main page");
  };

  const handleLoginRedirect = () => {
    alert("Go to login page");
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-header">
          <button className="back-link" onClick={handleBack}>←</button>
          <h2 className="register-title">Create Account</h2>
        </div>

        <p className="register-subtitle">
          Sign up to create your professional networking account.
        </p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              name="firstName"
              placeholder="First name"
              value={formData.firstName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              placeholder="Last name"
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>

        <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

        <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Birthday</label>
            <div className="birth-row">
              <select name="month" value={formData.month} onChange={handleChange}>
                <option value="">Month</option>
                <option value="1">Jan</option>
                <option value="2">Feb</option>
                <option value="3">Mar</option>
                <option value="4">Apr</option>
                <option value="5">May</option>
                <option value="6">Jun</option>
                <option value="7">Jul</option>
                <option value="8">Aug</option>
                <option value="9">Sep</option>
                <option value="10">Oct</option>
                <option value="11">Nov</option>
                <option value="12">Dec</option>
              </select>

              <select name="day" value={formData.day} onChange={handleChange}>
                <option value="">Day</option>
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>

              <select name="year" value={formData.year} onChange={handleChange}>
                <option value="">Year</option>
                {Array.from({ length: 80 }, (_, i) => {
                  const year = 2025 - i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
          </div>


          <button type="submit" className="submit-btn">
            Submit
          </button>

          <button
            type="button"
            className="bottom-link"
            onClick={handleLoginRedirect}
          >
            I already have an account
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;