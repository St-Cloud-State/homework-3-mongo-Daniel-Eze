// Switch to or create the database
//use acmeLoans

// Insert a new loan application
db.applications.insertOne({
  app_id: "APP1001",
  name: "Jane Doe",
  zipcode: "12345",
  address: "789 Elm St",
  status: "received",
  notes: [
    {
      phase: "submission",
      timestamp: new Date(),
      message: "Application submitted"
    }
  ]
})

// Add a credit check note
db.applications.updateOne(
  { app_id: "APP1001" },
  { $push: {
      notes: {
        phase: "credit_check",
        timestamp: new Date(),
        message: "Credit score verified (730)"
      }
    }
  }
)

// Change status to processing
db.applications.updateOne(
  { app_id: "APP1001" },
  { $set: { status: "processing" } }
)

// Add certification check note
db.applications.updateOne(
  { app_id: "APP1001" },
  { $push: {
      notes: {
        phase: "certification_check",
        timestamp: new Date(),
        message: "Employment certified"
      }
    }
  }
)

// Change status to accepted
db.applications.updateOne(
  { app_id: "APP1001" },
  { $set: { status: "accepted" } }
)

// Add loan terms note
db.applications.updateOne(
  { app_id: "APP1001" },
  { $push: {
      notes: {
        phase: "accepted",
        timestamp: new Date(),
        message: "Approved for 4.5% APR, 20-year fixed"
      }
    }
  }
)

// Show final result
print("\n==== Final Application Document ====")
printjson(db.applications.findOne({ app_id: "APP1001" }))
