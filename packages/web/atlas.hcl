data "external_schema" "drizzle" {
  program = ["bunx", "drizzle-kit", "export"]
}

env "local" {
  url = "sqlite://file:local.db"
  dev = "sqlite://dev?mode=memory"

  schema {
    src = data.external_schema.drizzle.url
  }

  migration {
    dir = "file://drizzle"
  }
}
