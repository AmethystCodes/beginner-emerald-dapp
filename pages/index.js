import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Nav from '../components/Nav.jsx';
import { useState, useEffect } from 'react';
import * as fcl from '@onflow/fcl';

export default function Home() {

  const [newGreeting, setNewGreeting] = useState('');
  const [ greeting, setGreeting ] = useState('');
  const [ txStatus, setTxStatus ] = useState('Run Transaction');

  async function runTransaction() {
    const transactionId = await fcl.mutate({
      cadence: `
      import HelloWorld from 0xe5ac316a97a507dc

      transaction(myNewGreeting: String) {
        
        prepare(signer: AuthAccount) {}
          
        execute {
          HelloWorld.changeGreeting(newGreeting: myNewGreeting)
        }
      }
      `,
      args: (arg, t) => [
        arg(newGreeting, t.String)
      ],
      proposer: fcl.authz,
      payer: fcl.authz,
      authorization: [fcl.authz],
      limit: 999
    })

    console.log("Here is the transactionId: " + transactionId);

    fcl.tx(transactionId).subscribe(res => {
      console.log(res);
      if (res.status === 0 || res.status === 1) {
        setTxStatus('Pending...');
      } else if (res.status === 2) {
        setTxStatus('Finalized...')
      } else if (res.status === 3) {
        setTxStatus('Executed...');
      } else if (res.status === 4) {
        setTxStatus('Sealed!');
        setTimeout(() => setTxStatus('Run Transaction'), 2000);
      }
    })

    await fcl.tx(transactionId).onceSealed();
    executeScript();
  }

  async function executeScript() {
    const response = await fcl.query({
      cadence: `
      import HelloWorld from 0xe5ac316a97a507dc

      pub fun main(): String {
        return HelloWorld.greeting
      }
      `, 
      args: (arg, t) => []
    })

    setGreeting(response)
  }

  useEffect(() => {
    executeScript()
  }, [])

  return (
    <div className={styles.container}>
      <Head>
        <title>Emerald DApp</title>
        <meta name="description" content="Created by Amethyst" />
        <link rel="icon" href="https://i.imgur.com/hvNtbgD.png" />
      </Head>

      <Nav />

      <div className={styles.welcome}>
        <h1 className={styles.title}>
          Welcome to my <a href="https://academy.ecdao.org" target="_blank">Emerald DApp!</a>
        </h1>
        <p>Created by <a href="https://twitter.com/AmethystCodes" target="_blank"><i>Amethyst✨</i></a></p>
      </div>

      <main className={styles.main}>
        <p>{greeting}</p>
        <div className={styles.flex}>
          <input onChange={(e) => setNewGreeting(e.target.value)} placeholder="Add a New Greeting!" onFocus={(e) => e.target.placeholder = ""}/>
          <button onClick={runTransaction}>{txStatus}</button>
        </div>
      </main>
    </div>
  )
}