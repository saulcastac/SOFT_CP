
async function main() {
    console.log("Testing POST /api/tractocamiones...");
    const body = {
        customId: "R-DEBUG-001",
        marca: "DebugBrand",
        modelo: "2025",
        placa: "DBG-001",
        pesoBrutoVehicular: "20000", // String as from form
        userId: "user_1" // Should be ignored or handled by backend? Backend overrides it.
    };

    try {
        const res = await fetch("http://localhost:3000/api/tractocamiones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            console.error("Status:", res.status);
            const text = await res.text();
            console.error("Error body:", text);
        } else {
            const json = await res.json();
            console.log("Success:", json);
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

main();
