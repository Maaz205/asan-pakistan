import React, { useMemo, useState } from "react";

import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CarFront,
  Check,
  Clock3,
  MapPin,
  Menu,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
  Zap
} from "lucide-react";

const vehicles = [
  {
    id: "mini",
    name: "Asan Mini",
    detail: "Affordable everyday rides",
    seats: "3 seats",
    base: 100,
    rate: 30,
    icon: "🚗",
    tag: "Budget friendly"
  },
  {
    id: "go",
    name: "Asan Go",
    detail: "A little more room to relax",
    seats: "4 seats",
    base: 150,
    rate: 35,
    icon: "🚙",
    tag: "Popular"
  },
  {
    id: "xl",
    name: "Asan XL",
    detail: "Extra space for your group",
    seats: "6 seats",
    base: 250,
    rate: 50,
    icon: "🚐",
    tag: "More space"
  }
];

function money(value) {
  return new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0
  }).format(value);
}

export default function App() {
  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [distance, setDistance] = useState("12");
  const [vehicle, setVehicle] = useState("go");
  const [notice, setNotice] = useState("");

  const [myRides, setMyRides] = useState([]);
const [ridesLoading, setRidesLoading] = useState(false);
const [ridesError, setRidesError] = useState("");

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [authName, setAuthName] = useState("");
const [authEmail, setAuthEmail] = useState("");
const [authPassword, setAuthPassword] = useState("");
const [authLoading, setAuthLoading] = useState(false);
const [authMessage, setAuthMessage] = useState("");


const [currentUser, setCurrentUser] = useState(() => {
  const savedUser = sessionStorage.getItem("asanUser");
  return savedUser ? JSON.parse(savedUser) : null;
});

const [showMyRides, setShowMyRides] = useState(false);


const [driverAuthOpen, setDriverAuthOpen] = useState(false);
const [driverAuthMode, setDriverAuthMode] = useState("login");
const [driverName, setDriverName] = useState("");
const [driverEmail, setDriverEmail] = useState("");
const [driverPassword, setDriverPassword] = useState("");
const [driverAuthLoading, setDriverAuthLoading] = useState(false);
const [driverAuthMessage, setDriverAuthMessage] = useState("");

const [currentDriver, setCurrentDriver] = useState(() => {
  const savedDriver = sessionStorage.getItem("asanDriver");
  return savedDriver ? JSON.parse(savedDriver) : null;
});

const [driverRequests, setDriverRequests] = useState([]);
const [driverMyRides, setDriverMyRides] = useState([]);


async function fetchMyRides() {
  const token = sessionStorage.getItem("asanToken");

  if (!token) {
    setMyRides([]);
    return;
  }

  setRidesLoading(true);
  setRidesError("");

  try {
    const response = await fetch("http://localhost:5000/api/rides", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load your rides.");
    }

    setMyRides(data.rides || []);
  } catch (error) {
    setRidesError(error.message);
  } finally {
    setRidesLoading(false);
  }
}

async function cancelRide(rideId) {
  const token = sessionStorage.getItem("asanToken");

  if (!window.confirm("Kya aap waqai yeh ride cancel karna chahte hain?")) {
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5000/api/rides/${rideId}/cancel`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Ride cancel nahi hui.");
    }

    alert("Ride successfully cancelled!");
    await fetchMyRides();
  } catch (error) {
    alert(error.message);
  }
}

async function handleDriverAuthSubmit(e) {
  e.preventDefault();
  setDriverAuthLoading(true);
  setDriverAuthMessage("");

  const isSignup = driverAuthMode === "signup";

  try {
    const response = await fetch(
      `http://localhost:5000/api/driver/${isSignup ? "signup" : "login"}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(isSignup ? { name: driverName } : {}),
          email: driverEmail,
          password: driverPassword,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Driver login failed.");
    }

    sessionStorage.setItem("asanDriverToken", data.token);
    sessionStorage.setItem("asanDriver", JSON.stringify(data.user));

    setCurrentDriver(data.user);
    setDriverAuthOpen(false);
    setTimeout(() => {
  fetchDriverRides();
}, 0);
    setDriverName("");
    setDriverEmail("");
    setDriverPassword("");
  } catch (error) {
    setDriverAuthMessage(error.message);
  } finally {
    setDriverAuthLoading(false);
  }
}


async function fetchDriverRides() {
  const token = sessionStorage.getItem("asanDriverToken");

  try {
    const [requestsResponse, myRidesResponse] = await Promise.all([
      fetch("http://localhost:5000/api/driver/rides", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("http://localhost:5000/api/driver/my-rides", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const requestsData = await requestsResponse.json();
    const myRidesData = await myRidesResponse.json();

    if (!requestsResponse.ok) {
      throw new Error(requestsData.message || "Requests load nahi hui.");
    }

    if (!myRidesResponse.ok) {
      throw new Error(myRidesData.message || "My rides load nahi hui.");
    }

    setDriverRequests(requestsData.rides || []);
    setDriverMyRides(myRidesData.rides || []);
  } catch (error) {
    console.error("Driver rides error:", error);
    alert(error.message);
  }
}

async function acceptDriverRide(rideId) {
  const token = sessionStorage.getItem("asanDriverToken");

  try {
    const response = await fetch(
      `http://localhost:5000/api/driver/rides/${rideId}/accept`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Ride accept nahi hui.");
    }

    alert("Ride successfully accepted!");
    await fetchDriverRides();
  } catch (error) {
    alert(error.message);
  }
}


function handleLogout() {
  sessionStorage.removeItem("asanToken");
  sessionStorage.removeItem("asanUser");
  setCurrentUser(null);
}


  const selectedVehicle =
    vehicles.find((item) => item.id === vehicle) || vehicles[1];

  const fare = useMemo(() => {
    const km = Number(distance);

    if (!Number.isFinite(km) || km <= 0) {
      return 0;
    }

    return Math.round(
      selectedVehicle.base + km * selectedVehicle.rate
    );
  }, [distance, selectedVehicle]);

  async function handleBooking(event) {
    event.preventDefault();
if (!currentUser || !sessionStorage.getItem("asanToken")) {
  setNotice("Please login first to book a ride.");
  setAuthMode("login");
  setAuthOpen(true);
  return;
}
    if (!passengerName.trim() || !passengerPhone.trim()) {
      setNotice("Please enter your name and phone number.");
      return;
    }

    if (!pickup.trim() || !destination.trim()) {
      setNotice("Please add both your pickup and destination.");
      return;
    }

    if (
      !Number.isFinite(Number(distance)) ||
      Number(distance) <= 0 ||
      Number(distance) > 500
    ) {
      setNotice("Enter a distance between 1 and 500 km.");
      return;
    }

    setIsSubmitting(true);
    setNotice("");

    try {
      const response = await fetch("http://localhost:5000/api/rides", {
        method: "POST",
     headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("asanToken")}`,
},
        body: JSON.stringify({
          passengerName: passengerName.trim(),
          passengerPhone: passengerPhone.trim(),
          pickupLocation: pickup.trim(),
          dropoffLocation: destination.trim(),
          rideType: vehicle,
          fare,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Booking failed. Please try again.");
      }

      setNotice(
        `Ride booked successfully! ${selectedVehicle.name} from ${pickup.trim()} to ${destination.trim()} — estimated PKR ${money(fare)}. Booking ID: ${result.ride._id}`
      );
    } catch (error) {
      setNotice(
        error.message || "Could not connect to the backend. Make sure it is running."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function openAuth(mode) {
    setAuthMode(mode);
    setAuthOpen(true);
    setMobileMenu(false);
  }

  function scrollToBooking() {
  const bookingSection = document.getElementById("book");

  if (bookingSection) {
    bookingSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    setMobileMenu(false);
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();

  setAuthLoading(true);
  setAuthMessage("");

  try {
    const endpoint =
      authMode === "signup"
        ? "http://localhost:5000/api/auth/signup"
        : "http://localhost:5000/api/auth/login";

    const body =
      authMode === "signup"
        ? {
            name: authName,
            email: authEmail,
            password: authPassword,
          }
        : {
            email: authEmail,
            password: authPassword,
          };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      setAuthMessage(data.message || "Something went wrong.");
      return;
    }

    sessionStorage.setItem("asanToken", data.token);
    sessionStorage.setItem(
      "asanUser",
      JSON.stringify(data.user)
    );


setCurrentUser(data.user);
fetchMyRides();

setAuthMessage(
  authMode === "login"
    ? "Login successful!"
    : "Account created successfully!"
);

setTimeout(() => {
  setAuthOpen(false);
  setAuthMessage("");
}, 1200);

    setAuthName("");
    setAuthEmail("");
    setAuthPassword("");
  } catch (error) {
    setAuthMessage(
      "Server se connection nahi ho raha. Backend check karo."
    );
  } finally {
    setAuthLoading(false);
  }
}


if (currentDriver) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#home">
          <span className="brand-mark">
            <CarFront size={25} />
          </span>
          <span className="brand-copy">
            <strong>asan<span>Pakistan</span></strong>
            <small>Driver Dashboard</small>
          </span>
        </a>

        <button
          className="nav-login"
          onClick={() => {
            sessionStorage.removeItem("asanDriverToken");
            sessionStorage.removeItem("asanDriver");
            setCurrentDriver(null);
          }}
        >
          Logout
        </button>
      </header>

      <main style={{ padding: "60px 24px" }}>
        <span className="section-kicker">DRIVER DASHBOARD</span>
        <h1>Welcome to Asan Pakistan!</h1>
        <h2>Welcome, {currentDriver.name}</h2>
        <p>You are logged in as a driver.</p>

        <div className="notice">
          <h3>New Ride Requests</h3>

          {driverRequests.length === 0 ? (
            <p>No new ride requests available.</p>
          ) : (
            driverRequests.map((ride) => (
              <div className="notice" key={ride._id}>
                <h4>{ride.passengerName}</h4>
                <p>Pickup: {ride.pickupLocation}</p>
                <p>Destination: {ride.dropoffLocation}</p>
                <p>Ride Type: {ride.rideType}</p>
                <p>Fare: PKR {ride.fare}</p>
                <button
                  className="nav-signup"
                  onClick={() => acceptDriverRide(ride._id)}
                >
                  Accept Ride
                </button>
              </div>
            ))
          )}
        </div>

        <div className="notice">
          <h3>My Active Rides</h3>

          {driverMyRides.length === 0 ? (
            <p>You have no accepted rides yet.</p>
          ) : (
            driverMyRides.map((ride) => (
              <div className="notice" key={ride._id}>
                <h4>{ride.passengerName}</h4>
                <p>Pickup: {ride.pickupLocation}</p>
                <p>Destination: {ride.dropoffLocation}</p>
                <p>Fare: PKR {ride.fare}</p>
                <p>Status: {ride.status}</p>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}


  return (
    
    <div className="app-shell">
      <div className="announcement">
        <Sparkles size={14} />
        A simpler way to get around Pakistan
        <span className="announcement-dot">•</span>
        Built for everyday journeys
      </div>

      <header className="site-header">
        <a
          className="brand"
          href="#home"
          aria-label="Asan Pakistan home"
        >
          <span className="brand-mark">
            <CarFront size={25} strokeWidth={2.5} />
          </span>

          <span className="brand-copy">
            <strong>
              asan<span>Pakistan</span>
            </strong>
            <small>Rides made simple</small>
          </span>
        </a>

        <button
          className="mobile-toggle"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Toggle navigation"
        >
          {mobileMenu ? <X /> : <Menu />}
        </button>
<nav className={mobileMenu ? "nav-links open" : "nav-links"}>
  <a href="#how" onClick={() => setMobileMenu(false)}>
    How it works
  </a>

  <a href="#rides" onClick={() => setMobileMenu(false)}>
    Ride options
  </a>

  <a href="#safety" onClick={() => setMobileMenu(false)}>
    Safety
  </a>


{currentUser ? (
  <>
    <button
      className="nav-login"
      onClick={() => {
        setDriverAuthOpen(true);
        setMobileMenu(false);
      }}
    >
      As a Driver
    </button>

    <span className="user-greeting">
      Hi, {currentUser.name}
    </span>

    <button
      className="nav-login"
      onClick={() => {
        setShowMyRides(true);
        fetchMyRides();
        setMobileMenu(false);
      }}
    >
      My Rides
    </button>

    <button
      className="nav-login"
      onClick={() => {
        handleLogout();
        setMobileMenu(false);
      }}
    >
      Logout
    </button>
  </>
) : (
  <>
    <button
      className="nav-login"
      onClick={() => openAuth("login")}
    >
      Log in
    </button>

    <button
      className="nav-signup"
      onClick={() => openAuth("signup")}
    >
      Get started <ArrowUpRight size={16} />
    </button>

    <button
      className="nav-login"
      onClick={() => {
        setDriverAuthOpen(true);
        setMobileMenu(false);
      }}
    >
      As a Driver
    </button>
  </>
)}

</nav>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-line"></span>
              YOUR CITY. YOUR RIDE.
            </div>

            <h1>
              Every journey,
              <br />
              <span>made asan.</span>
            </h1>

            <p className="hero-description">
              Getting there should be the easy part. Plan your ride,
              see an estimated fare, and get moving with Asan Pakistan.
            </p>

            <div className="hero-actions">
           

<a
  href="#book"
  className="primary-button"
  onClick={(e) => {
    e.preventDefault();
    document.getElementById("book")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setMobileMenu(false);
  }}
>
  Book a ride <ArrowRight size={18} />
</a>



              <a className="text-link" href="#how">
                See how it works <ArrowDown size={15} />
              </a>
            </div>

            <div className="hero-trust">
              <div className="avatar-stack">
                <span>A</span>
                <span>P</span>
                <span>K</span>
              </div>

              <div>
                <div className="trust-stars">
                  <Star size={13} fill="currentColor" />
                  <Star size={13} fill="currentColor" />
                  <Star size={13} fill="currentColor" />
                  <Star size={13} fill="currentColor" />
                  <Star size={13} fill="currentColor" />
                </div>

                <small>Designed around everyday riders</small>
              </div>
            </div>
          </div>

          <div className="hero-art">
            <div className="art-glow"></div>

            <div className="city-label">
              <span className="live-dot"></span>
              MADE FOR PAKISTAN
              <span className="city-label-sep">/</span>
              EVERYDAY TRAVEL
            </div>

            <div className="route route-one"></div>
            <div className="route route-two"></div>

            <div className="map-pin pin-one">
              <MapPin size={18} fill="currentColor" />
            </div>

            <div className="map-pin pin-two">
              <MapPin size={18} fill="currentColor" />
            </div>

            <div className="map-street street-a"></div>
            <div className="map-street street-b"></div>
            <div className="map-street street-c"></div>

            <div className="floating-card pickup-card">
              <span className="mini-icon green">
                <MapPin size={16} />
              </span>

              <span>
                <small>PICKUP</small>
                <strong>Your location</strong>
              </span>

              <Check size={16} className="check-icon" />
            </div>

            <div className="car-scene">
              <div className="car-shadow"></div>

              <div className="car-body">
                <div className="car-roof"></div>
                <div className="car-window"></div>
                <div className="car-front-window"></div>
                <div className="car-door-line"></div>
                <div className="car-handle"></div>
                <div className="car-light"></div>

                <div className="car-wheel wheel-left">
                  <i></i>
                </div>

                <div className="car-wheel wheel-right">
                  <i></i>
                </div>
              </div>
            </div>

            <div className="floating-card fare-card">
              <span className="mini-icon dark">
                <Zap size={16} />
              </span>

              <span>
                <small>YOUR ESTIMATE</small>
                <strong>
                  PKR 570 <em>· demo</em>
                </strong>
              </span>

              <span className="fare-check">
                <Check size={14} />
              </span>
            </div>

            <div className="art-caption">
              <span>01</span>
              <span className="caption-rule"></span>
              <span>MOVE WITH EASE</span>
            </div>
          </div>
        </section>

        <section
  className="booking-wrap"
  id="book"
  style={{ scrollMarginTop: "100px" }}
>
          <div className="booking-heading">
            <div>
              <span className="section-kicker">
                LET'S GET YOU THERE
              </span>
              <h2>Where to today?</h2>
            </div>

            <div className="booking-badge">
              <ShieldCheck size={16} />
              Simple. Clear. Convenient.
            </div>
          </div>

          <form className="booking-panel" onSubmit={handleBooking}>
        <div className="passenger-fields">
              <label className="field-group">
                <span className="field-label">PASSENGER NAME</span>
                <input
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  placeholder="Your full name"
                  maxLength={100}
                  required
                />
              </label>

              <label className="field-group">
                <span className="field-label">PHONE NUMBER</span>
                <input
                  type="tel"
                  value={passengerPhone}
                  onChange={(e) => setPassengerPhone(e.target.value)}
                  placeholder="03XXXXXXXXX"
                  maxLength={20}
                  required
                />
              </label>
            </div>

            <div className="location-fields">
              <label className="field-group">
                <span className="field-icon pickup-dot"></span>
                <span className="field-label">PICKUP LOCATION</span>

                <input
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="e.g. Gulshan-e-Iqbal, Karachi"
                  maxLength={200}
                />
              </label>

              <div className="field-connector">
                <span></span>
              </div>

              <label className="field-group">
                <span className="field-icon destination-pin">
                  <MapPin size={16} />
                </span>

                <span className="field-label">
                  YOUR DESTINATION
                </span>

                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Clifton, Karachi"
                  maxLength={200}
                />
              </label>
            </div>

            <div className="booking-divider"></div>

            <div className="booking-controls">
              <label className="distance-control">
                <span className="control-label">DISTANCE (KM)</span>

                <span className="distance-input">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    step="0.5"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                  />
                  <span>km</span>
                </span>
              </label>

              <div className="fare-preview">
                <span className="control-label">ESTIMATED FARE</span>
                <strong>PKR {money(fare)}</strong>
                <small>Estimated · may vary</small>
              </div>

              <button
                className="primary-button book-button"
                type="submit"
              >
                {isSubmitting ? "Booking..." : "Book this ride"} <ArrowRight size={17} />
              </button>
            </div>

            {notice && (
              <div
                className={
                  notice.startsWith("Ride booked successfully!")
                    ? "notice success"
                    : "notice"
                }
                role="status"
              >
                {notice}
              </div>
            )}
          </form>

          <p className="demo-note">
            <span className="note-dot"></span>
            Estimated fare is illustrative. Booking requests are saved to the backend.
          </p>
        </section>

        <section className="section ride-section" id="rides">
          <div className="section-heading">
            <div>
              <span className="section-kicker">FIND YOUR FIT</span>
              <h2>A ride for every kind of day.</h2>
            </div>

            <p>
              Choose the ride that fits your trip. Simple options,
              clear estimates.
            </p>
          </div>

          <div className="vehicle-grid">
            {vehicles.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`vehicle-card ${
                  vehicle === item.id ? "selected" : ""
                }`}
                onClick={() => {
                  setVehicle(item.id);
                  setNotice("");
                }}
              >
                <div className="vehicle-top">
                  <span className="vehicle-emoji">{item.icon}</span>

                  <span
                    className={`vehicle-tag ${
                      index === 1 ? "popular" : ""
                    }`}
                  >
                    {item.tag}
                  </span>
                </div>

                <div className="vehicle-name-row">
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.detail}</p>
                  </div>

                  <span className="vehicle-price">
                    PKR{" "}
                    {money(
                      item.base + Number(distance || 0) * item.rate
                    )}
                    <small> est.</small>
                  </span>
                </div>

                <div className="vehicle-bottom">
                  <span>
                    <Users size={14} />
                    {item.seats}
                  </span>

                  <span>
                    <Clock3 size={14} />
                    On demand
                  </span>

                  <span className="select-circle">
                    {vehicle === item.id && <Check size={13} />}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="how-section" id="how">
          <div className="how-intro">
            <span className="section-kicker">THREE SIMPLE STEPS</span>

            <h2>
              Less planning.
              <br />
              <span>More living.</span>
            </h2>

            <p>
              We believe booking a ride should feel effortless
              from the very first click.
            </p>

            <button
              className="outline-button"
              type="button"
              onClick={scrollToBooking}
            >
              Plan your ride <ArrowRight size={16} />
            </button>
          </div>

          <div className="steps">
            <article className="step">
              <span className="step-number">01</span>
              <div className="step-icon">
                <MapPin size={22} />
              </div>
              <h3>Choose your route</h3>
              <p>
                Add your pickup and destination to start planning
                your journey.
              </p>
            </article>

            <article className="step">
              <span className="step-number">02</span>
              <div className="step-icon">
                <CarFront size={22} />
              </div>
              <h3>Pick your ride</h3>
              <p>
                Explore ride options and get an estimated fare
                before you go.
              </p>
            </article>

            <article className="step">
              <span className="step-number">03</span>
              <div className="step-icon">
                <Check size={22} />
              </div>
              <h3>You're all set</h3>
              <p>
                Review your booking details. Live ride confirmation
                comes in a future version.
              </p>
            </article>
          </div>
        </section>

        <section className="safety-banner" id="safety">
          <div className="safety-icon">
            <ShieldCheck size={25} />
          </div>

          <div>
            <span className="section-kicker">BUILT WITH CARE</span>
            <h2>Your journey deserves peace of mind.</h2>
            <p>
              Our concept puts clarity and a thoughtful experience first.
              Driver verification and live safety tools are planned for
              a future release.
            </p>
          </div>

          <span className="safety-spark">
            <Sparkles size={24} />
          </span>
        </section>

        <section className="closing-cta">
          <div>
            <span className="section-kicker">
              YOUR NEXT JOURNEY STARTS HERE
            </span>
            <h2>Ready when you are.</h2>
            <p>A simpler ride is just a few details away.</p>
          </div>

          <button
            className="primary-button"
            type="button"
            onClick={scrollToBooking}
          >
            Plan a ride <ArrowRight size={18} />
          </button>
        </section>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#home">
          <span className="brand-mark">
            <CarFront size={23} />
          </span>

          <span className="brand-copy">
            <strong>
              asan<span>Pakistan</span>
            </strong>
            <small>Rides made simple</small>
          </span>
        </a>

        <p>Made for everyday journeys in Pakistan.</p>

        <div className="footer-right">
          <span>© 2026 Asan Pakistan</span>
          <span className="demo-pill">PORTFOLIO DEMO</span>
        </div>
      </footer>

          
{showMyRides && (
  <div className="modal-backdrop" onClick={() => setShowMyRides(false)}>
    <div
      className="auth-modal"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      <button
        className="modal-close"
        onClick={() => setShowMyRides(false)}
        type="button"
      >
        <X size={20} />
      </button>

      <span className="section-kicker">YOUR BOOKINGS</span>
      <h2>My Rides</h2>

      {ridesLoading && <p>Loading your rides...</p>}

      {ridesError && <p className="auth-message">{ridesError}</p>}

      {!ridesLoading && !ridesError && myRides.length === 0 && (
        <p>You haven't booked any rides yet.</p>
      )}

      {!ridesLoading && myRides.map((ride) => (
        <div key={ride._id} className="notice">
          <strong>
            {ride.rideType?.toUpperCase()} — PKR {ride.fare}
          </strong>

          <p>From: {ride.pickupLocation}</p>
          <p>To: {ride.dropoffLocation}</p>
          <p>Status: {ride.status}</p>
          {ride.driverName && (
  <p>
    Driver: <strong>{ride.driverName}</strong>
  </p>
)}
          {ride.status === "pending" && (
  <button
    type="button"
    className="nav-login"
    onClick={() => cancelRide(ride._id)}
  >
    Cancel Ride
  </button>
)}
          <small>
            {new Date(ride.createdAt).toLocaleString()}
          </small>
        </div>
      ))}
    </div>
  </div>
)}

{driverAuthOpen && (
  <div
    className="modal-backdrop"
    onClick={() => setDriverAuthOpen(false)}
  >
    <div
      className="auth-modal"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      <button
        className="modal-close"
        type="button"
        onClick={() => setDriverAuthOpen(false)}
      >
        <X size={20} />
      </button>

      <div className="modal-logo">
        <CarFront size={24} />
      </div>

      <span className="section-kicker">
        ASAN PAKISTAN DRIVER
      </span>

      <h2>
        {driverAuthMode === "login"
          ? "Welcome back, Driver."
          : "Join as a Driver."}
      </h2>

      <p>
        {driverAuthMode === "login"
          ? "Login to access your driver dashboard."
          : "Create your driver account."}
      </p>

      <form onSubmit={handleDriverAuthSubmit}>
        {driverAuthMode === "signup" && (
          <label className="modal-label">
            Full name
            <input
              type="text"
              required
              minLength={2}
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="Your name"
            />
          </label>
        )}

        <label className="modal-label">
          Email address
          <input
            type="email"
            required
            value={driverEmail}
            onChange={(e) => setDriverEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <label className="modal-label">
          Password
          <input
            type="password"
            required
            minLength={8}
            value={driverPassword}
            onChange={(e) => setDriverPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </label>

        <button
          className="primary-button modal-submit"
          type="submit"
          disabled={driverAuthLoading}
        >
          {driverAuthLoading
            ? "Please wait..."
            : driverAuthMode === "login"
              ? "Driver Login"
              : "Create Driver Account"}
          {!driverAuthLoading && <ArrowRight size={17} />}
        </button>

        {driverAuthMessage && (
          <p className="auth-message" role="alert">
            {driverAuthMessage}
          </p>
        )}
      </form>

      <div className="auth-switch">
        {driverAuthMode === "login"
          ? "New driver?"
          : "Already registered?"}

        <button
          type="button"
          onClick={() => {
            setDriverAuthMode(
              driverAuthMode === "login" ? "signup" : "login"
            );
            setDriverAuthMessage("");
          }}
        >
          {driverAuthMode === "login" ? "Sign up" : "Log in"}
        </button>
      </div>
    </div>
  </div>
)}


      {authOpen && (
        <div className="modal-backdrop" onClick={() => setAuthOpen(false)}>
          <div
            className="auth-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setAuthOpen(false)}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="modal-logo">
              <CarFront size={24} />
            </div>
            <span className="section-kicker">WELCOME TO ASAN PAKISTAN</span>
            <h2 id="auth-title">
              {authMode === "login"
                ? "Welcome back."
                : "Let's get you moving."}
            </h2>
            <p>
              {authMode === "login"
                ? "Log in to continue your journey."
                : "Create an account for simpler journeys."}
            </p>

       <form onSubmit={handleAuthSubmit}>
          
<label className="modal-label">
  Email address
  <input
    type="email"
    required
    placeholder="you@example.com"
    value={authEmail}
    onChange={(e) => setAuthEmail(e.target.value)}
  />
</label>


        
{authMode === "signup" && (
  <label className="modal-label">
    Full name
    <input
      type="text"
      required
      minLength="2"
      placeholder="Your name"
      value={authName}
      onChange={(e) => setAuthName(e.target.value)}
    />
  </label>
)}


<input
  type="password"
  required
  minLength="8"
  placeholder="At least 8 characters"
  value={authPassword}
  onChange={(e) => setAuthPassword(e.target.value)}
/>



<button
  className="primary-button modal-submit"
  type="submit"
  disabled={authLoading}
>
  {authLoading
    ? "Please wait..."
    : authMode === "login"
      ? "Log in"
      : "Create account"}
  {!authLoading && <ArrowRight size={17} />}
</button>
{authMessage && (
  <p role="alert" className="auth-message">
    {authMessage}
  </p>
)}
            </form>

            <div className="auth-switch">
              {authMode === "login"
                ? "New to Asan Pakistan?"
                : "Already have an account?"}
              <button
                type="button"
                onClick={() =>
                  setAuthMode(authMode === "login" ? "signup" : "login")
                }
              >
                {authMode === "login" ? "Sign up" : "Log in"}
              </button>
            </div>

            <p className="modal-disclaimer">
              Demo only. No account details are sent or stored.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}