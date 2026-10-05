import assert from "node:assert/strict"
import { test } from "node:test"
import { profileSchema } from "@postulatrack/contracts"

const valid = { firstName: "Ana", lastName: "García", country: "Perú", career: "Ingeniería de Sistemas", phone: "+51 987 654 321", graduationYear: 2027 }

test("perfil acepta país/carrera propios y conserva registros previos sin país", () => {
  assert.equal(profileSchema.safeParse(valid).success, true)
  assert.equal(profileSchema.safeParse({ firstName: "Ana", lastName: "García", country: null }).success, true)
  assert.equal(profileSchema.safeParse({ ...valid, country: "Nueva Zelanda", career: "Geografía" }).success, true)
})

test("API rechaza teléfono y año evidentemente erróneos aunque el navegador se omita", () => {
  assert.equal(profileSchema.safeParse({ ...valid, phone: "gfhvjbh" }).success, false)
  assert.equal(profileSchema.safeParse({ ...valid, graduationYear: 20000 }).success, false)
})
