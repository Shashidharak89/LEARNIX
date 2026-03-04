"use client";

import { useState } from "react";
import { Client } from "@gradio/client";

export default function TestHFAPI() {

  const [helloMsg, setHelloMsg] = useState("");
  const [sum, setSum] = useState("");

  const callHello = async () => {
    const client = await Client.connect("shashidharak99/Test");
    const result = await client.predict("/hello", {});
    setHelloMsg(JSON.stringify(result.data));
  };

  const callAdd = async () => {
    const client = await Client.connect("shashidharak99/Test");

    const result = await client.predict("/add", {
      a: 5,
      b: 3
    });

    setSum(JSON.stringify(result.data));
  };

  return (
    <div style={{padding:30}}>

      <h2>Hugging Face APIs</h2>

      <button onClick={callHello}>
        Call Hello API
      </button>

      <p>{helloMsg}</p>

      <button onClick={callAdd}>
        Call Add API
      </button>

      <p>{sum}</p>

    </div>
  );
}