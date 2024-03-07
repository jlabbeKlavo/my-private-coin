import { Notifier, Ledger, JSON, Crypto, Context } from '@klave/sdk';
import { ErrorMessage } from './types';
import { AcctTp, Account, Allowed } from './rosalind';
import { Currency } from './eipx';

const DefaultCoinTable = "DefaultCoinTable";
const AccountsTable = "AccountsTable";

class RegisteredAccount {
    exists: bool;
    details: Account;    

    constructor(exists: bool, details: Account) {
        this.exists = exists;
        this.details = details;
    }
}


/**
 * @query return a boolean value indicating whether the address is registered 
 * 
 * @param address - the address to be checked
 * */
function recoverRegistredAccounts(address: string): RegisteredAccount {
    let currencyInfo = Ledger.getTable(DefaultCoinTable).get("Info");
    if (currencyInfo.length === 0) {     
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `Currency not found`
        });
        return new RegisteredAccount(false, new Account());
    }      
    else {
        let currencyDetails = JSON.parse<Currency>(currencyInfo);
        if (currencyDetails.accounts.indexOf(address) === -1) {
            Notifier.sendJson<ErrorMessage>({
                success: false,
                message: `Address {$address} not found in the list of registered accounts`
            });
            return new RegisteredAccount(false, new Account());
        }
    }

    let account = Ledger.getTable(AccountsTable).get(address);
    if (account.length === 0) {
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `Address not found in the accounts table`
        });
        return new RegisteredAccount(false, new Account());
    }
    let accountDetails = JSON.parse<Account>(account);
    return new RegisteredAccount(true, accountDetails);
}

/** 
 * @transaction
 * @param {Account} input - A parsed input argument
 *  */
export function openAccount(accountInfo: Account): void {
    let currencyInfo = Ledger.getTable(DefaultCoinTable).get("Info");   

    let currencyDetails = new Currency();    
    if (currencyInfo.length === 0) {                    
        currencyDetails.id = Crypto.getKey("Default").name;
        currencyDetails.name = "Default";
        currencyDetails.symbol = "DEF";
        currencyDetails.totalSupply = 100000;
        currencyDetails.accounts = [];               
        currencyDetails.accounts.push(Context.get('sender'));

        Ledger.getTable(DefaultCoinTable).set("Info", JSON.stringify(currencyDetails));

        Notifier.sendJson<ErrorMessage>({
            success: true,
            message: `Currency ${currencyDetails.name} created successfully`
        });
    }            
    else {    
        currencyDetails = JSON.parse<Currency>(currencyInfo);
    }

    let account = Ledger.getTable(AccountsTable).get(Context.get('sender'));
    if (account.length === 0) {
        let accountDetails = new Account();
        accountDetails.AccountType = accountInfo.AccountType;
        accountDetails.balance = currencyDetails.totalSupply;

        Ledger.getTable(AccountsTable).set(Context.get('sender'), JSON.stringify(accountDetails));
        Notifier.sendJson<ErrorMessage>({
            success: true,
            message: `Account created successfully`
        });
    } else {
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `Account already exists`
        });
    }
}

/** 
 * @query return total supply of the currency
 * @param {OpenAccount} input - A parsed input argument
 *  */
export function totalSupply(): string {
    let currencyInfo = Ledger.getTable(DefaultCoinTable).get("Info");
    if (currencyInfo.length === 0) {     
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `Currency not found`
        });
    }
    else {
        let currencyDetails = JSON.parse<Currency>(currencyInfo);
        return currencyDetails.totalSupply.toString();
    }
    return "0";
}

/** 
 * @query return balances of the currency
 * @param {OpenAccount} input - A parsed input argument
 *  */
export function balanceOf(owner: string): string {
    if (owner === "") {
        owner = Context.get('sender');
    }        
    let fromAccount = recoverRegistredAccounts(owner);
    if (!fromAccount.exists)
        return "0";

    return fromAccount.details.balance.toString();
}

/** 
 * @transaction transfer token for a specified address
 * @param to - the address to transfer to
 * @param value - the amount to be transferred
 *  */
export function transfer(to: string, value: number): void {
    let from = Context.get('sender');
    let fromAccount = recoverRegistredAccounts(from);
    let toAccount = recoverRegistredAccounts(to);
    if (!fromAccount.exists || !toAccount.exists)
        return;

    if (fromAccount.details.balance < value) {
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `Insufficient balance`
        });
    }        
    fromAccount.details.balance -= value;
    toAccount.details.balance += value;
    Ledger.getTable(AccountsTable).set(from, JSON.stringify(fromAccount.details));
    Ledger.getTable(AccountsTable).set(to, JSON.stringify(toAccount.details));

    Notifier.sendJson<ErrorMessage>({
        success: true,
        message: `Transfer successful`
    });
}

/** 
 * @transaction approve the passed address to spend the specified amount of tokens on behalf of msg.sender
 * @param spender - the address which will spend the funds
 * @param value - the amount of tokens to be spent
 *  */
export function approve(spender: string, value: number): void {
    let from = Context.get('sender');
    let fromAccount = recoverRegistredAccounts(from);
    if (!fromAccount.exists)
        return;
        
    let index = fromAccount.details.findAllowed(spender);
    if (index === -1) {        
        return;
    }

    fromAccount.details.allowed[index].value = value;

    Ledger.getTable(DefaultCoinTable).set(from, JSON.stringify(fromAccount.details));
    Notifier.sendJson<ErrorMessage>({
        success: true,
        message: `Approve successful`
    });
}

/** 
 * @transaction transfer token from one address to another
 * @param from - the address to transfer from
 * @param to - the address to transfer to
 * @param value - the amount to be transferred
 *  */
export function transferFrom(from: string, to: string, value: number): void {
    let fromAccount = recoverRegistredAccounts(from);
    let toAccount = recoverRegistredAccounts(to);
    if (!fromAccount.exists || !toAccount.exists)
        return;

    if (fromAccount.details.balance < value) {
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `Insufficient balance`
        });
        return;
    }        

    let index = fromAccount.details.findAllowed(to);
    if (index === -1) {        
        return;
    }

    if (fromAccount.details.allowed[index].value < value) {
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `Insufficient allowance`
        });
        return;
    }        

    fromAccount.details.balance -= value;
    toAccount.details.balance += value;
    Ledger.getTable(AccountsTable).set(from, JSON.stringify(fromAccount.details));
    Ledger.getTable(AccountsTable).set(to, JSON.stringify(toAccount.details));

    Notifier.sendJson<ErrorMessage>({
        success: true,
        message: `Transfer successful`
    });
}

/** 
 * @query return the amount which spender is still allowed to withdraw from owner
 * @param owner - the address giving the allowance
 * @param spender - the address receiving the allowance
 *  */
export function allowance(owner: string, spender: string): string {
    let fromAccount = recoverRegistredAccounts(owner);
    if (!fromAccount.exists)
        return "0";

    let index = fromAccount.details.findAllowed(spender);
    if (index === -1) {        
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `No allowance found`
        });
        return "0";
    }
    
    return fromAccount.details.allowed[index].value.toString();
}

/**
 * @query increase the amount which spender is still allowed to withdraw from owner
 * @param spender - the address which will spend the funds
 * @param addedValue - the amount of tokens to be added
 */
export function increaseAllowance(spender: string, addedValue: number): void {
    let from = Context.get('sender');
    let fromAccount = recoverRegistredAccounts(from);
    if (!fromAccount.exists)
        return;

    let index = fromAccount.details.findAllowed(spender);
    if (index === -1) {        
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `No allowance found`
        });
        return;
    }
            
    fromAccount.details.allowed[index].value += addedValue;
    if (fromAccount.details.allowed[index].value > fromAccount.details.balance) {
        fromAccount.details.allowed[index].value = fromAccount.details.balance;
        Notifier.sendJson<ErrorMessage>({
            success: true,
            message: `Allowance increased up to the maximum balance of the account`
        });    
    }    
    else {
        Notifier.sendJson<ErrorMessage>({
            success: true,
            message: `Allowance increased successfully`
        });    
    }
    Ledger.getTable(DefaultCoinTable).set(from, JSON.stringify(fromAccount.details));
}

/**
 * @query decrease the amount which spender is still allowed to withdraw from owner
 * @param spender - the address which will spend the funds
 * @param subtractedValue - the amount of tokens to be subtracted
 */
export function decreaseAllowance(spender: string, subtractedValue: number): void {
    let from = Context.get('sender');
    let fromAccount = recoverRegistredAccounts(from);
    if (!fromAccount.exists)
        return;

    let index = fromAccount.details.findAllowed(spender);
    if (index === -1) {        
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `No allowance found`
        });
        return;
    }
            
    fromAccount.details.allowed[index].value -= subtractedValue;
    if (fromAccount.details.allowed[index].value < 0) {
        fromAccount.details.allowed[index].value = 0;
        Notifier.sendJson<ErrorMessage>({
            success: true,
            message: `Allowance decreased to the minimum value of 0`
        });    
    }
    else {
        Notifier.sendJson<ErrorMessage>({
            success: true,
            message: `Allowance decreased successfully`
        });    
    }
    Ledger.getTable(DefaultCoinTable).set(from, JSON.stringify(fromAccount.details));
}

/**
 * @transaction mint tokens to the specified address
 * @param to - the address to mint to
 * @param value - the amount to be minted
 */
export function mint(to: string, value: number): void {
    let currencyInfo = Ledger.getTable(DefaultCoinTable).get("Info");
    if (currencyInfo.length === 0) {     
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `Currency not found`
        });
        return;
    }
    else {
        let currencyDetails = JSON.parse<Currency>(currencyInfo);
        currencyDetails.totalSupply += value;
        Ledger.getTable(DefaultCoinTable).set("Info", JSON.stringify(currencyDetails));

        let toAccount = recoverRegistredAccounts(to);
        if (!toAccount.exists)
            return;

        toAccount.details.balance += value;
        Ledger.getTable(AccountsTable).set(to, JSON.stringify(toAccount.details));

        Notifier.sendJson<ErrorMessage>({
            success: true,
            message: `Mint successful`
        });
    }
}

/**
 * @transaction burn tokens from the specified address
 * @param from - the address to burn from
 * @param value - the amount to be burned
 */
export function burn(from: string, value: number): void {
    let currencyInfo = Ledger.getTable(DefaultCoinTable).get("Info");
    if (currencyInfo.length === 0) {     
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `Currency not found`
        });
        return;
    }
    else {
        let currencyDetails = JSON.parse<Currency>(currencyInfo);
        currencyDetails.totalSupply -= value;
        if (currencyDetails.totalSupply < 0) {
            currencyDetails.totalSupply = 0;
        }
        Ledger.getTable(DefaultCoinTable).set("Info", JSON.stringify(currencyDetails));
    
        let fromAccount = recoverRegistredAccounts(from);
        if (!fromAccount.exists)
            return;

        if (fromAccount.details.balance < value) {
            Notifier.sendJson<ErrorMessage>({
                success: false,
                message: `Insufficient balance`
            });
            return;
        }        
        fromAccount.details.balance -= value;
        if (fromAccount.details.balance < 0) {
            fromAccount.details.balance = 0;
        }
        Ledger.getTable(AccountsTable).set(from, JSON.stringify(fromAccount.details));
        Notifier.sendJson<ErrorMessage>({
            success: true,
            message: `Burn successful`
        });
    }
}

/**
 * @transaction burn tokens from the spender's allowance for sender account
 * @param address - the address of the spender
 * @param value - the amount to be burned
 */
export function burnFrom(address: string, value: number): void {
    let currencyInfo = Ledger.getTable(DefaultCoinTable).get("Info");
    if (currencyInfo.length === 0) {     
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `Currency not found`
        });
    }
    else {
        let currencyDetails = JSON.parse<Currency>(currencyInfo);
        currencyDetails.totalSupply -= value;
        if (currencyDetails.totalSupply < 0) {
            currencyDetails.totalSupply = 0;
        }
    
        let [fromExists, fromAccountDetails] = recoverRegistredAccounts(Context.get('sender'));
        if (!fromExists)
            return;

        if (fromAccountDetails.balance < value) {
            Notifier.sendJson<ErrorMessage>({
                success: false,
                message: `Insufficient balance`
            });
        }        
        if (fromAccountDetails.allowed[address] < value) {
            Notifier.sendJson<ErrorMessage>({
                success: false,
                message: `Insufficient allowance`
            });
        }        
        fromAccountDetails.balance -= value;
        if (fromAccountDetails.balance < 0) {
            fromAccountDetails.balance = 0;
        }
        fromAccountDetails.allowed[address] -= value;
        if (fromAccountDetails.allowed[address] < 0) {
            fromAccountDetails.allowed[address] = 0;
        }
        Ledger.getTable(AccountsTable).set(Context.get('sender'), JSON.stringify(fromAccountDetails));
        Ledger.getTable(DefaultCoinTable).set("Info", JSON.stringify(currencyDetails));
        Notifier.sendJson<ErrorMessage>({
            success: true,
            message: `Allowance burn successful`
        });
    }
}
