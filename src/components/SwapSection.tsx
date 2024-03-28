"use client";

import React, { useState, useEffect } from "react";
import Web3 from "web3";
import { Contract } from "web3-eth-contract";
import bittexAbi from "../bittex.json";
import { truncateString } from "@/utils/truncateString";

const contractAddress = "0xCA3f028bB42C01036DbFc5fF20a3e6C58Fe0Acf1";

const initialWalletState = {
  metaMaskConnected: false,
  walletAddress: null as string | null,
  contract: null as Contract<any> | null,
};

type WalletState = typeof initialWalletState;

const initialSwapState = {
  loading: false,
  result: null as string | null,
  error: null as string | null,
};

type SwapState = typeof initialSwapState;

const SwapSection: React.FC = () => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [walletState, setWalletState] =
    useState<WalletState>(initialWalletState);
  const [swapState, setSwapState] = useState<SwapState>(initialSwapState);

  const { metaMaskConnected, walletAddress, contract } = walletState;
  const { loading, result, error } = swapState;

  useEffect(() => {
    loadWeb3();
  }, []);

  const loadWeb3 = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        const deployedContract = new web3Instance.eth.Contract(
          bittexAbi as any,
          contractAddress
        );
        setWalletState((prevWalletState) => ({
          ...prevWalletState,
          contract: deployedContract,
        }));
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setWalletState((prevWalletState) => ({
            ...prevWalletState,
            metaMaskConnected: true,
            walletAddress: accounts[0],
          }));
        }
      }
    } catch (error) {
      console.error("Failed to load Web3:", error);
    }
  };

  const connectMetaMask = async () => {
    try {
      if (!web3) throw new Error("Web3 not initialized");
      await window.ethereum.enable();
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (accounts.length > 0) {
        setWalletState((prevWalletState) => ({
          ...prevWalletState,
          metaMaskConnected: true,
          walletAddress: accounts[0],
        }));
      }
    } catch (error) {
      setSwapState((prevSwapState) => ({
        ...prevSwapState,
        error: (error as Error).message,
      }));
    }
  };

  const switchToBinanceChain = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }],
      });
    } catch (error: any) {
      setSwapState((prevSwapState) => ({
        ...prevSwapState,
        error: "Failed to switch network",
      }));
    }
  };

  const createSwap = async () => {
    try {
      if (!web3 || !contract || !metaMaskConnected || loading) return;
      await switchToBinanceChain();
      setSwapState((prevSwapState) => ({
        ...prevSwapState,
        error: null,
        loading: true,
      }));

      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length === 0) {
        throw new Error("No accounts found. Please connect to MetaMask.");
      }

      const inputTokenAddress = "0xFc19E4Ce0e0a27B09f2011eF0512669A0F76367A";
      const outputTokenAddress = "0x970609bA2C160a1b491b90867681918BDc9773aF";
      const inputTokenAmount = "1";

      await contract.methods
        .createSwap(inputTokenAddress, outputTokenAddress, inputTokenAmount)
        .send({ from: accounts[0] });

      setSwapState((prevSwapState) => ({
        ...prevSwapState,
        result: "Swap created successfully",
        loading: false,
      }));
    } catch ({ error, message, code }: any) {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length === 0) {
        setWalletState((prevWalletState) => ({
          ...prevWalletState,
          metaMaskConnected: false,
          walletAddress: null,
        }));
      }

      setSwapState((prevSwapState) => ({
        ...prevSwapState,
        error: error?.message || message,
        loading: false,
      }));
    }
  };

  return (
    <div className="flex flex-col flex-1 justify-center items-center h-full w-full">
      <div className="flex gap-5">
        <button
          onClick={connectMetaMask}
          className="bg-green-500 text-white px-4 py-2 rounded truncate"
        >
          {metaMaskConnected
            ? `Connected: ${truncateString(walletAddress!, 15)}`
            : "Connect with MetaMask"}
        </button>

        <button
          onClick={createSwap}
          className={`bg-orange-500 text-white px-4 py-2 rounded ${
            (!metaMaskConnected || loading) && "opacity-50 cursor-not-allowed"
          }`}
          disabled={!metaMaskConnected || loading}
        >
          {loading ? "Loading..." : "Create Swap"}
        </button>
      </div>

      {error && <p className="text-red-500 mt-5">Error: {error}</p>}
      {result && <p>Result: {result}</p>}
    </div>
  );
};

export default SwapSection;
