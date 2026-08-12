import request from "supertest";
import app from "../src/app.js";
import Ride from "../src/models/ride.model.js";
import RideStatusHistory from "../src/models/rideStatusHistory.model.js";
import { createUser, createRideBody } from "./helpers.js";

describe("Authentication", () => {
  test("customer can register", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test Customer",
        email: "customer@example.com",
        password: "password123",
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Test Customer");
    expect(response.body.email).toBe("customer@example.com");
    expect(response.body.role).toBe("CUSTOMER");
  });

  test("customer can login", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        name: "Login Customer",
        email: "login@example.com",
        password: "password123",
      });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "login@example.com",
        password: "password123",
      });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe("login@example.com");
  });

  test("login fails with incorrect password", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        name: "Wrong Password",
        email: "wrong@example.com",
        password: "password123",
      });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "wrong@example.com",
        password: "wrongpassword",
      });

    expect(response.status).toBe(401);
  });

  test("registration fails when required fields are missing", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: "missing@example.com",
      });

    expect(response.status).toBe(400);
  });
});


describe("Authorization", () => {
  test("customer cannot access admin metrics", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        name: "Customer",
        email: "customer@example.com",
        password: "password123",
      });

    const login = await request(app)
      .post("/api/auth/login")
      .send({
        email: "customer@example.com",
        password: "password123",
      });

    const response = await request(app)
      .get("/api/admin/metrics")
      .set("Authorization", `Bearer ${login.body.token}`);

    expect(response.status).toBe(403);
  });

  test("driver cannot access customer-only endpoint", async () => {
    const driver = await createUser({
      name: "Driver",
      email: "driver@example.com",
      role: "DRIVER",
    });

    const login = await request(app)
      .post("/api/auth/login")
      .send({
        email: driver.email,
        password: "password123",
      });

    const response = await request(app)
      .get("/api/rides/my")
      .set("Authorization", `Bearer ${login.body.token}`);

    expect(response.status).toBe(403);
  });
});


describe("Customer rides", () => {
  test("customer can create a ride", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        name: "Customer",
        email: "customer@example.com",
        password: "password123",
      });

    const login = await request(app)
      .post("/api/auth/login")
      .send({
        email: "customer@example.com",
        password: "password123",
      });

    const response = await request(app)
      .post("/api/rides")
      .set("Authorization", `Bearer ${login.body.token}`)
      .send({
        pickupLocation: "Tezpur University",
        dropLocation: "Railway Station",
        estimatedDistance: 12,
        requestedTime: "2026-08-11T18:30:00.000Z",
      });

    expect(response.status).toBe(201);
    expect(response.body.ride.status).toBe("REQUESTED");
    expect(response.body.ride.customerId).toBeDefined();
    expect(response.body.ride.estimatedFare).toBeDefined();
  });

  test("customer can get their own rides", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        name: "Customer",
        email: "customer@example.com",
        password: "password123",
      });

    const login = await request(app)
      .post("/api/auth/login")
      .send({
        email: "customer@example.com",
        password: "password123",
      });

    await request(app)
      .post("/api/rides")
      .set("Authorization", `Bearer ${login.body.token}`)
      .send({
        pickupLocation: "A",
        dropLocation: "B",
        estimatedDistance: 10,
        requestedTime: "2026-08-11T18:30:00.000Z",
      });

    const response = await request(app)
      .get("/api/rides/my")
      .set("Authorization", `Bearer ${login.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
    expect(response.body.rides).toHaveLength(1);
  });

  test("customer cannot access another customer's ride", async () => {
    const customerA = await createUser({
      name: "Customer A",
      email: "a@example.com",
    });

    const customerB = await createUser({
      name: "Customer B",
      email: "b@example.com",
    });

    const loginA = await request(app)
      .post("/api/auth/login")
      .send({
        email: customerA.email,
        password: "password123",
      });

    const loginB = await request(app)
      .post("/api/auth/login")
      .send({
        email: customerB.email,
        password: "password123",
      });

    const rideResponse = await request(app)
      .post("/api/rides")
      .set("Authorization", `Bearer ${loginA.body.token}`)
      .send({
        pickupLocation: "A",
        dropLocation: "B",
        estimatedDistance: 10,
        requestedTime: "2026-08-11T18:30:00.000Z",
      });

    const rideId = rideResponse.body.ride._id;

    const response = await request(app)
      .get(`/api/rides/${rideId}`)
      .set("Authorization", `Bearer ${loginB.body.token}`);

    expect(response.status).toBe(403);
  });
});


describe("Driver rides", () => {
  test("driver can see available requested rides", async () => {
    const customer = await createUser({
      name: "Customer",
      email: "customer@example.com",
    });

    const driver = await createUser({
      name: "Driver",
      email: "driver@example.com",
      role: "DRIVER",
    });

    const customerLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: customer.email,
        password: "password123",
      });

    const driverLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: driver.email,
        password: "password123",
      });

    await request(app)
      .post("/api/rides")
      .set("Authorization", `Bearer ${customerLogin.body.token}`)
      .send({
        pickupLocation: "A",
        dropLocation: "B",
        estimatedDistance: 10,
        requestedTime: "2026-08-11T18:30:00.000Z",
      });

    const response = await request(app)
      .get("/api/rides/available")
      .set("Authorization", `Bearer ${driverLogin.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body.rides).toHaveLength(1);
    expect(response.body.rides[0].status).toBe("REQUESTED");
  });

  test("driver can accept a requested ride", async () => {
    const customer = await createUser({
      name: "Customer",
      email: "customer@example.com",
    });

    const driver = await createUser({
      name: "Driver",
      email: "driver@example.com",
      role: "DRIVER",
    });

    const customerLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: customer.email,
        password: "password123",
      });

    const driverLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: driver.email,
        password: "password123",
      });

    const rideResponse = await request(app)
      .post("/api/rides")
      .set("Authorization", `Bearer ${customerLogin.body.token}`)
      .send({
        pickupLocation: "A",
        dropLocation: "B",
        estimatedDistance: 10,
        requestedTime: "2026-08-11T18:30:00.000Z",
      });

    const rideId = rideResponse.body.ride._id;

    const response = await request(app)
      .post(`/api/rides/${rideId}/accept`)
      .set("Authorization", `Bearer ${driverLogin.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body.ride.status).toBe("ACCEPTED");
    expect(response.body.ride.driverId).toBe(driver._id.toString());
  });
});


describe("Ride status", () => {
  test("driver can update status through a valid transition", async () => {
    const customer = await createUser({
      name: "Customer",
      email: "customer@example.com",
    });

    const driver = await createUser({
      name: "Driver",
      email: "driver@example.com",
      role: "DRIVER",
    });

    const customerLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: customer.email,
        password: "password123",
      });

    const driverLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: driver.email,
        password: "password123",
      });

    const rideResponse = await request(app)
      .post("/api/rides")
      .set("Authorization", `Bearer ${customerLogin.body.token}`)
      .send({
        pickupLocation: "A",
        dropLocation: "B",
        estimatedDistance: 10,
        requestedTime: "2026-08-11T18:30:00.000Z",
      });

    const rideId = rideResponse.body.ride._id;

    await request(app)
      .post(`/api/rides/${rideId}/accept`)
      .set("Authorization", `Bearer ${driverLogin.body.token}`);

    const response = await request(app)
      .patch(`/api/rides/${rideId}/status`)
      .set("Authorization", `Bearer ${driverLogin.body.token}`)
      .send({
        status: "DRIVER_ARRIVING",
      });

    expect(response.status).toBe(200);
    expect(response.body.ride.status).toBe("DRIVER_ARRIVING");
  });

  test("invalid ride status transition is rejected", async () => {
    const customer = await createUser({
      name: "Customer",
      email: "customer@example.com",
    });

    const driver = await createUser({
      name: "Driver",
      email: "driver@example.com",
      role: "DRIVER",
    });

    const customerLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: customer.email,
        password: "password123",
      });

    const driverLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: driver.email,
        password: "password123",
      });

    const rideResponse = await request(app)
      .post("/api/rides")
      .set("Authorization", `Bearer ${customerLogin.body.token}`)
      .send({
        pickupLocation: "A",
        dropLocation: "B",
        estimatedDistance: 10,
        requestedTime: "2026-08-11T18:30:00.000Z",
      });

    const rideId = rideResponse.body.ride._id;

    await request(app)
      .post(`/api/rides/${rideId}/accept`)
      .set("Authorization", `Bearer ${driverLogin.body.token}`);

    const response = await request(app)
      .patch(`/api/rides/${rideId}/status`)
      .set("Authorization", `Bearer ${driverLogin.body.token}`)
      .send({
        status: "COMPLETED",
      });

    expect(response.status).toBe(400);
  });
});


describe("Cancellation", () => {
  test("customer can cancel a requested ride", async () => {
    const customer = await createUser({
      name: "Customer",
      email: "customer@example.com",
    });

    const login = await request(app)
      .post("/api/auth/login")
      .send({
        email: customer.email,
        password: "password123",
      });

    const rideResponse = await request(app)
      .post("/api/rides")
      .set("Authorization", `Bearer ${login.body.token}`)
      .send({
        pickupLocation: "A",
        dropLocation: "B",
        estimatedDistance: 10,
        requestedTime: "2026-08-11T18:30:00.000Z",
      });

    const rideId = rideResponse.body.ride._id;

    const response = await request(app)
      .post(`/api/rides/${rideId}/cancel`)
      .set("Authorization", `Bearer ${login.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body.ride.status).toBe("CANCELLED");
  });

  test("customer cannot cancel a started ride", async () => {
    const customer = await createUser({
      name: "Customer",
      email: "customer@example.com",
    });

    const driver = await createUser({
      name: "Driver",
      email: "driver@example.com",
      role: "DRIVER",
    });

    const customerLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: customer.email,
        password: "password123",
      });

    const driverLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: driver.email,
        password: "password123",
      });

    const rideResponse = await request(app)
      .post("/api/rides")
      .set("Authorization", `Bearer ${customerLogin.body.token}`)
      .send({
        pickupLocation: "A",
        dropLocation: "B",
        estimatedDistance: 10,
        requestedTime: "2026-08-11T18:30:00.000Z",
      });

    const rideId = rideResponse.body.ride._id;

    await request(app)
      .post(`/api/rides/${rideId}/accept`)
      .set("Authorization", `Bearer ${driverLogin.body.token}`);

    await request(app)
      .patch(`/api/rides/${rideId}/status`)
      .set("Authorization", `Bearer ${driverLogin.body.token}`)
      .send({
        status: "DRIVER_ARRIVING",
      });

    await request(app)
      .patch(`/api/rides/${rideId}/status`)
      .set("Authorization", `Bearer ${driverLogin.body.token}`)
      .send({
        status: "STARTED",
      });

    const response = await request(app)
      .post(`/api/rides/${rideId}/cancel`)
      .set("Authorization", `Bearer ${customerLogin.body.token}`);

    expect(response.status).toBe(400);
  });
});

describe("Ride acceptance concurrency", () => {
  test("only one driver can accept the same ride", async () => {
    const customer = await createUser({
      name: "Customer",
      email: "customer@example.com",
    });

    const driverA = await createUser({
      name: "Driver A",
      email: "driverA@example.com",
      role: "DRIVER",
    });

    const driverB = await createUser({
      name: "Driver B",
      email: "driverB@example.com",
      role: "DRIVER",
    });

    const customerLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: customer.email,
        password: "password123",
      });

    const driverALogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: driverA.email,
        password: "password123",
      });

    const driverBLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: driverB.email,
        password: "password123",
      });

    const rideResponse = await request(app)
      .post("/api/rides")
      .set("Authorization", `Bearer ${customerLogin.body.token}`)
      .send({
        pickupLocation: "A",
        dropLocation: "B",
        estimatedDistance: 10,
        requestedTime: "2026-08-11T18:30:00.000Z",
      });

    const rideId = rideResponse.body.ride._id;

    const [responseA, responseB] = await Promise.all([
      request(app)
        .post(`/api/rides/${rideId}/accept`)
        .set("Authorization", `Bearer ${driverALogin.body.token}`),

      request(app)
        .post(`/api/rides/${rideId}/accept`)
        .set("Authorization", `Bearer ${driverBLogin.body.token}`),
    ]);

    const statuses = [
      responseA.status,
      responseB.status,
    ].sort();

    expect(statuses).toEqual([200, 409]);

    const ride = await Ride.findById(rideId);

    expect(ride.status).toBe("ACCEPTED");

    expect([
      driverA._id.toString(),
      driverB._id.toString(),
    ]).toContain(ride.driverId.toString());
  });
});

test("status changes create history records", async () => {
  const customer = await createUser({
    name: "Customer",
    email: "customer@example.com",
  });

  const driver = await createUser({
    name: "Driver",
    email: "driver@example.com",
    role: "DRIVER",
  });

  const customerLogin = await request(app)
    .post("/api/auth/login")
    .send({
      email: customer.email,
      password: "password123",
    });

  const driverLogin = await request(app)
    .post("/api/auth/login")
    .send({
      email: driver.email,
      password: "password123",
    });

  const rideResponse = await request(app)
    .post("/api/rides")
    .set("Authorization", `Bearer ${customerLogin.body.token}`)
    .send({
      pickupLocation: "A",
      dropLocation: "B",
      estimatedDistance: 10,
      requestedTime: "2026-08-11T18:30:00.000Z",
    });

  const rideId = rideResponse.body.ride._id;

  await request(app)
    .post(`/api/rides/${rideId}/accept`)
    .set("Authorization", `Bearer ${driverLogin.body.token}`);

  const history = await RideStatusHistory.find({
    rideId,
  });

  expect(history).toHaveLength(1);
  expect(history[0].previousStatus).toBe("REQUESTED");
  expect(history[0].newStatus).toBe("ACCEPTED");
});