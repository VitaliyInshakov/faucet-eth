import { useCallback, useEffect, useState } from "react";
import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";

import { loadContract } from "./utils/loadContract";
import "./App.css";

function App() {
    const [web3Api, setWeb3Api] = useState({
        provider: null,
        isProviderLoaded: false,
        web3: null,
        contract: null,
    });
    const [account, setAccount] = useState(null);
    const [balance, setBalance] = useState(0);
    const [shouldReload, reload] = useState(false);

    const isContractConnected = account && web3Api.contract;
    const reloadEffect = useCallback(() => reload(!shouldReload), [shouldReload]);
    const setAccountListener = (provider) => {
        provider.on("accountsChanged", () => window.location.reload());
        provider.on("chainChanged", () => window.location.reload());

        // provider._jsonRpcConnection.events.on("notification", payload => {
        //     const { method } = payload;
        //     if (method === "metamask_unlockStateChanged") {
        //         setAccount(null);
        //     }
        // });
    };

    useEffect(() => {
        const loadProvider = async () => {
            const provider = await detectEthereumProvider();

            if (provider) {
                const contract = await loadContract("Faucet", provider);
                setAccountListener(provider);
                setWeb3Api({
                    web3: new Web3(provider),
                    provider,
                    contract,
                    isProviderLoaded: true,
                });
            } else {
                setWeb3Api(prevState => ({ ...prevState, isProviderLoaded: true }));
                console.error("Please install MetaMask!");
            }
        }

        loadProvider();
    }, []);

    useEffect(() => {
        const loadBalance = async () => {
            const { contract, web3 } = web3Api;
            const balance = await web3.eth.getBalance(contract.address);
            setBalance(web3.utils.fromWei(balance, "ether"));
        };

        web3Api.contract && loadBalance();
    }, [web3Api, shouldReload]);

    useEffect(() => {
        const getAccount = async () => {
            const accounts = await web3Api.web3.eth.getAccounts();
            setAccount(accounts[0]);
        };

        web3Api.web3 && getAccount();
    }, [web3Api.web3]);

    const addFunds = useCallback(async () => {
        const { contract, web3 } = web3Api;

        await contract.addFunds({
            from: account,
            value: web3.utils.toWei("1", "ether"),
        });

        reloadEffect();
    }, [web3Api, account, reloadEffect]);

    const withdrawFunds = useCallback(async () => {
        const { contract, web3 } = web3Api;
        const amount = web3.utils.toWei("0.1", "ether");
        await contract.withdraw(amount, { from: account });

        reloadEffect();
    }, [web3Api, account, reloadEffect]);

    return (
        <>
            <div className="faucet-wrapper">
                <div className="faucet">
                    {web3Api.isProviderLoaded
                        ? <div className="is-flex is-align-items-center">
                        <span>
                            <strong className="mr-2">Account: </strong>
                        </span>
                            {account
                                ? <div>{account}</div>
                                : !web3Api.provider
                                    ? <>
                                        <div className="notification is-warning is-small is-rounded">
                                            Wallet is not detected!{` `}
                                            <a
                                                href="https://docs.metamask.io"
                                                target="_blank"
                                                rel="noreferrer"
                                            >Install Metamask</a>
                                        </div>
                                    </>
                                    : <button
                                        className="button is-info"
                                        onClick={() => web3Api.provider.request({ method: "eth_requestAccounts" })}
                                    >Connect Wallet</button>}
                        </div>
                        : <span>Looking for Web3...</span>}
                    <div className="balance-view is-size-2 my-4">
                        Current Balance: <strong>{balance}</strong> ETH
                    </div>
                    {!isContractConnected && <i className="is-block">Connect to Ganache</i>}
                    <button
                        disabled={!isContractConnected}
                        className="button is-link mr-2"
                        onClick={addFunds}
                    >Donate 1 ETH</button>
                    <button
                        disabled={!isContractConnected}
                        className="button is-primary"
                        onClick={withdrawFunds}
                    >Withdraw 0.1 ETH</button>
                </div>
            </div>
        </>
    );
}

export default App;
