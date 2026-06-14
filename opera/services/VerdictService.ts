export async function* synthesizeVerdict(sessionId: string): AsyncGenerator<string, void, unknown> {
  const tokens = ['The', ' council', ' has', ' reached', ' a', ' decision.', ' We', ' recommend', ' pursuing', ' the', ' career', ' transition', ' with', ' strict', ' boundaries.']
  for (const token of tokens) {
    yield token
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
}
