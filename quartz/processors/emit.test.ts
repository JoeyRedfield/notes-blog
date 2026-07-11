import assert from "node:assert/strict"
import test, { describe } from "node:test"
import * as emitModule from "./emit"
import type { ProcessedContent } from "../plugins/vfile"
import type { QuartzEmitterPluginInstance } from "../plugins/types"

describe("contentForEmitter", () => {
  const realContent = ["real"] as unknown as ProcessedContent[]
  const contentWithVirtual = ["real", "virtual"] as unknown as ProcessedContent[]

  function select(name: string) {
    const helper = emitModule.contentForEmitter
    assert.equal(typeof helper, "function")
    return helper({ name } as QuartzEmitterPluginInstance, realContent, contentWithVirtual)
  }

  test("passes only real content to CustomOgImages", () => {
    assert.strictEqual(select("CustomOgImages"), realContent)
  })

  test("continues passing virtual pages to other emitters", () => {
    assert.strictEqual(select("ContentIndex"), contentWithVirtual)
  })
})
