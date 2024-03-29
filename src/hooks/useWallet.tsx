import { useState, useEffect } from "react";
import Web3 from "web3";
import { Contract } from "web3-eth-contract";
import bittexAbi from "../bittex.json";

const contractAddress = "0xCA3f028bB42C01036DbFc5fF20a3e6C58Fe0Acf1";

const initialWalletState = {
  metaMaskConnected: false,
  walletAddress: null as string | null,
  contract: null as Contract<any> | null,
  connectLoading: false,
};

type WalletState = typeof initialWalletState;

const useWallet = () => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [walletState, setWalletState] =
    useState<WalletState>(initialWalletState);

  const loadWeb3AndContract = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        const deployedContract = new web3Instance.eth.Contract(
          bittexAbi as any,
          contractAddress
        );

        if (accounts.length > 0) {
          setWalletState((prevWalletState) => ({
            ...prevWalletState,
            metaMaskConnected: true,
            walletAddress: accounts[0],
            contract: deployedContract,
          }));
        }
      }
    } catch (error) {
      console.error("Failed to load Web3 and contract:", error);
    }
  };

  useEffect(() => {
    loadWeb3AndContract();
  }, []);

  return { web3, walletState, setWalletState };
};

export default useWallet;
