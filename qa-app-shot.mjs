export default async function run(page) {
  await page.goto("http://localhost:8091/contacts");
  await page.waitForTimeout(5000); // let the launch splash clear
  await page.waitForFunction(
    () => document.body.innerText.includes("LIPA NA M-PESA"),
    { timeout: 30000 },
  );

  // Scroll the app's own scroll container to the M-PESA card.
  await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll("div"));
    const scroller = nodes.find(
      (n) => n.scrollHeight > n.clientHeight + 200 && n.clientHeight > 300,
    );
    if (scroller) scroller.scrollTop = 980;
  });
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: "c:\\Users\\FalamaS\\aic-hola\\qa-redo-app3.png",
  });
  return { ok: true };
}
