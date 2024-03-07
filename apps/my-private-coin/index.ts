import { Notifier, Ledger, JSON, Crypto, Context } from '@klave/sdk';
import { ApproveInput, ErrorMessage, TransferInput, TransferFromInput, AllowanceInput, IncreaseAllowanceInput, DecreaseAllowanceInput, MintInput, BurnInput, BurnFromInput } from './types';
import { Account } from './rosalind';
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
 * @function return a boolean value indicating whether the address is registered 
 * @param address - the address to be checked
 * */
const recoverRegisteredAccounts = function(address: string): RegisteredAccount {
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
 * @param {Currency} input - A parsed input argument
 *  */
export function createCoin(input: Currency): void {
    let currencyInfo = Ledger.getTable(DefaultCoinTable).get("Info");   
    if (currencyInfo.length === 0) {                    
    }
    else {
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `Currency already exists`
        });
        return;
    }

    let currencyDetails = new Currency(input.name, input.symbol, input.totalSupply);

    let key = Crypto.ECDSA.generateKey(input.name);
    Notifier.sendString(key.name);
    currencyDetails.id = key.name;

    Notifier.sendString(key.getPublicKey().getPem());
    currencyDetails.publicKey = key.getPublicKey().getPem();

    let ctx_sender = Context.get('sender');
    Notifier.sendString(ctx_sender);    
    currencyDetails.accounts.push(ctx_sender);

    Notifier.sendString(currencyDetails.accounts.length.toString());

    // Ledger.getTable(DefaultCoinTable).set("Info", JSON.stringify(currencyDetails));
    Notifier.sendJson<ErrorMessage>({
        success: true,
        message: `Currency ${currencyDetails.name} created successfully`
    });
}

/** 
 * @transaction
 * @param {Account} input - A parsed input argument
 *  */
export function openAccount(accountInfo: Account): void {
    let currencyInfo = Ledger.getTable(DefaultCoinTable).get("Info");   

    if (currencyInfo.length === 0) {                    
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `Currency not found`
        });
        return;
    }            
    let currencyDetails = JSON.parse<Currency>(currencyInfo);
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
 * @param {string} owner - the address of the owner, takes the sender's address if not provided
 *  */
export function balanceOf(owner: string): string {
    if (owner === "") {
        owner = Context.get('sender');
    }        
    let fromAccount = recoverRegisteredAccounts(owner);
    if (!fromAccount.exists)
        return "0";

    return fromAccount.details.balance.toString();
}

/** 
 * @transaction 
 * @param {TransferInput} - A parsed input argument containing the "to" address and the value to be paid
 *  */
export function transfer(input: TransferInput): void {
    let from = Context.get('sender');
    let fromAccount = recoverRegisteredAccounts(from);
    let toAccount = recoverRegisteredAccounts(input.to);
    if (!fromAccount.exists || !toAccount.exists)
        return;

    if (fromAccount.details.balance < input.value) {
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `Insufficient balance`
        });
        return;
    }        
    fromAccount.details.balance -= input.value;
    toAccount.details.balance += input.value;
    Ledger.getTable(AccountsTable).set(from, JSON.stringify(fromAccount.details));
    Ledger.getTable(AccountsTable).set(input.to, JSON.stringify(toAccount.details));

    Notifier.sendJson<ErrorMessage>({
        success: true,
        message: `Transfer successful`
    });

    return;
}

/** 
 * @transaction
 * @param {ApproveInput} - A parsed input argument containing the address of the spender and the value to be credited
 *  */
export function approve(input: ApproveInput): void {
    let from = Context.get('sender');
    let fromAccount = recoverRegisteredAccounts(from);
    if (!fromAccount.exists)
        return;
        
    let index = fromAccount.details.findAllowed(input.spender);
    if (index === -1) {        
        return;
    }

    fromAccount.details.allowed[index].value = input.value;

    Ledger.getTable(DefaultCoinTable).set(from, JSON.stringify(fromAccount.details));
    Notifier.sendJson<ErrorMessage>({
        success: true,
        message: `Approve successful`
    });
}

/** 
 * @transaction
 * @param {TransferFromInput} - A parsed input argument containing the "from" address, the "to" address and the value to be transferred
 *  */
export function transferFrom(input: TransferFromInput): void {
    let fromAccount = recoverRegisteredAccounts(input.from);
    let toAccount = recoverRegisteredAccounts(input.to);
    if (!fromAccount.exists || !toAccount.exists)
        return;

    if (fromAccount.details.balance < input.value) {
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `Insufficient balance`
        });
        return;
    }        

    let index = fromAccount.details.findAllowed(input.to);
    if (index === -1) {        
        return;
    }

    if (fromAccount.details.allowed[index].value < input.value) {
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `Insufficient allowance`
        });
        return;
    }        

    fromAccount.details.balance -= input.value;
    toAccount.details.balance += input.value;
    Ledger.getTable(AccountsTable).set(input.from, JSON.stringify(fromAccount.details));
    Ledger.getTable(AccountsTable).set(input.to, JSON.stringify(toAccount.details));

    Notifier.sendJson<ErrorMessage>({
        success: true,
        message: `Transfer successful`
    });
}

/** 
 * @query 
 * @param {AllowanceInput} - A parsed input argument containing the address of the owner and the address of the spender
 *  */
export function allowance(input: AllowanceInput): string {
    let fromAccount = recoverRegisteredAccounts(input.owner);
    if (!fromAccount.exists)
        return "0";

    let index = fromAccount.details.findAllowed(input.spender);
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
 * @param {IncreaseAllowanceInput} - A parsed input argument containing the address of the spender and the amount to be added
 */
export function increaseAllowance(input: IncreaseAllowanceInput): void {
    let from = Context.get('sender');
    let fromAccount = recoverRegisteredAccounts(from);
    if (!fromAccount.exists)
        return;

    let index = fromAccount.details.findAllowed(input.spender);
    if (index === -1) {        
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `No allowance found`
        });
        return;
    }
            
    fromAccount.details.allowed[index].value += input.addedValue;
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
 * @param {DecreaseAllowanceInput} - A parsed input argument containing the address of the spender and the amount to be subtracted
 */
export function decreaseAllowance(input: DecreaseAllowanceInput): void {
    let from = Context.get('sender');
    let fromAccount = recoverRegisteredAccounts(from);
    if (!fromAccount.exists)
        return;

    let index = fromAccount.details.findAllowed(input.spender);
    if (index === -1) {        
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `No allowance found`
        });
        return;
    }
            
    fromAccount.details.allowed[index].value -= input.subtractedValue;
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
 * @transaction create new tokens and assign them to the specified address
 * @param {MintInput} - A parsed input argument containing the address of the recipient and the amount of tokens to be created
 */
export function mint(input: MintInput): void {
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
        currencyDetails.totalSupply += input.value;
        Ledger.getTable(DefaultCoinTable).set("Info", JSON.stringify(currencyDetails));

        let toAccount = recoverRegisteredAccounts(input.to);
        if (!toAccount.exists)
            return;

        toAccount.details.balance += input.value;
        Ledger.getTable(AccountsTable).set(input.to, JSON.stringify(toAccount.details));

        Notifier.sendJson<ErrorMessage>({
            success: true,
            message: `Mint successful`
        });
    }
}

/**
 * @transaction Destroy tokens from the specified address
 * @param {BurnInput} - A parsed input argument containing the address of the sender and the amount of tokens to be destroyed
 */
export function burn(input: BurnInput): void {
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
        currencyDetails.totalSupply -= input.value;
        if (currencyDetails.totalSupply < 0) {
            currencyDetails.totalSupply = 0;
        }
        Ledger.getTable(DefaultCoinTable).set("Info", JSON.stringify(currencyDetails));
    
        let fromAccount = recoverRegisteredAccounts(input.from);
        if (!fromAccount.exists)
            return;

        if (fromAccount.details.balance < input.value) {
            Notifier.sendJson<ErrorMessage>({
                success: false,
                message: `Insufficient balance`
            });
            return;
        }        
        fromAccount.details.balance -= input.value;
        if (fromAccount.details.balance < 0) {
            fromAccount.details.balance = 0;
        }
        Ledger.getTable(AccountsTable).set(input.from, JSON.stringify(fromAccount.details));
        Notifier.sendJson<ErrorMessage>({
            success: true,
            message: `Burn successful`
        });
    }
}

/**
 * @transaction burn tokens from the spender's allowance for transaction sender account
 * @param {BurnFromInput} - A parsed input argument containing the address of the spender and the amount of tokens to be destroyed
 */
export function burnFrom(input: BurnFromInput): void {
    let currencyInfo = Ledger.getTable(DefaultCoinTable).get("Info");
    if (currencyInfo.length === 0) {     
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `Currency not found`
        });
    }
    else {    
        let fromAccount = recoverRegisteredAccounts(Context.get('sender'));
        if (!fromAccount.exists)
            return;

        let index = fromAccount.details.findAllowed(input.spender);
        if (index === -1) {        
            Notifier.sendJson<ErrorMessage>({
                success: false,
                message: `No spender allowance found`
            });
            return;
        }
                    
        if (fromAccount.details.allowed[index].value < input.value) {            
            Notifier.sendJson<ErrorMessage>({
                success: false,
                message: `Insufficient spender allowance`
            });        
            return;    
        }
        if (fromAccount.details.balance < input.value) {            
            Notifier.sendJson<ErrorMessage>({
                success: false,
                message: `Insufficient balance`
            });        
            return;    
        }
        let currencyDetails = JSON.parse<Currency>(currencyInfo);         
        if (currencyDetails.totalSupply < input.value) {
            Notifier.sendJson<ErrorMessage>({
                success: false,
                message: `Insufficient total supply`
            });                    
        }
        currencyDetails.totalSupply -= input.value;
        Ledger.getTable(DefaultCoinTable).set("Info", JSON.stringify(currencyDetails));

        fromAccount.details.allowed[index].value -= input.value;
        fromAccount.details.balance -= input.value;        
        Ledger.getTable(AccountsTable).set(Context.get('sender'), JSON.stringify(fromAccount.details));


        Notifier.sendJson<ErrorMessage>({
            success: true,
            message: `Allowance burn successful`
        });
    }
}
