'use strict';

describe('JsonRewriter', function() {
  var rewriter = window.rippleclient.rewriter,
    account = 'rfXK4fN2AAqH7H5Uo94JQwT88qQkv69pqR',
    data = {engine_result: 'tesSUCCESS', engine_result_code: 0, engine_result_message: 'The transaction was applied. Only final in a validated ledger.', ledger_hash: '3A42FDDA268818463C360402FB37A1D95F4C7463C3C8568535C65358A9AFCFE2', ledger_index: 11412348, meta: { AffectedNodes: [{CreatedNode: {LedgerEntryType: 'RippleState', LedgerIndex: '40865600F1D8928F756718AF147BA726784A6C76317C08F9FB0A0530F38F48CE', NewFields: { Balance: { currency: 'TST', issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji', value: '0'}, Flags: 1114112, HighLimit: { currency: 'TST', issuer: 'rfXK4fN2AAqH7H5Uo94JQwT88qQkv69pqR', value: '0'}, LowLimit: { currency: 'TST', issuer: 'rp8rJYTpodf8qbSCHVTNacf8nSW8mRakFw', value: '541'}}}}, { ModifiedNode: { FinalFields: { Account: 'rp8rJYTpodf8qbSCHVTNacf8nSW8mRakFw', Balance: '71363800', Flags: 0, OwnerCount: 9, Sequence: 54}, LedgerEntryType: 'AccountRoot', LedgerIndex: '8B24E55376A65D68542C17F3BF446231AC7062CB43BED28817570128A1849819', PreviousFields:{ Balance: '71375800', OwnerCount: 8, Sequence: 53 }, PreviousTxnID: '8E194F430FF573C4BC748FA4B73A0CBA778A50A1855E8677FADBAE16E595CD4E', PreviousTxnLgrSeq: 11412343}}, { ModifiedNode: { FinalFields: { Flags: 0, Owner: 'rp8rJYTpodf8qbSCHVTNacf8nSW8mRakFw', RootIndex: 'D7198895F90CB2FBCA3D7DEECABA4104FB92287E8B8B1F26DB94525A5ABC3808'}, LedgerEntryType: 'DirectoryNode', LedgerIndex: 'D7198895F90CB2FBCA3D7DEECABA4104FB92287E8B8B1F26DB94525A5ABC3808'}}, { ModifiedNode: { FinalFields: { Account: 'rfXK4fN2AAqH7H5Uo94JQwT88qQkv69pqR', Balance: '118407447', Flags: 0, OwnerCount: 7, Sequence: 560 }, LedgerEntryType: 'AccountRoot', LedgerIndex: 'E47087B762FD22F5F36E8B7188BEA18659F443092041684A6C0C757609E1DF86', PreviousTxnID: '8E194F430FF573C4BC748FA4B73A0CBA778A50A1855E8677FADBAE16E595CD4E', PreviousTxnLgrSeq: 11412343}}, { ModifiedNode: { FinalFields: { Flags: 0, Owner: 'rfXK4fN2AAqH7H5Uo94JQwT88qQkv69pqR', RootIndex: 'F9F86D42EBA6096BE7FF953C60572E68D430D760CAD4F78BD04F2EE1450EA6B5'}, LedgerEntryType: 'DirectoryNode', LedgerIndex: 'F9F86D42EBA6096BE7FF953C60572E68D430D760CAD4F78BD04F2EE1450EA6B5'}}], TransactionIndex: 12, TransactionResult: 'tesSUCCESS'}, status: 'closed', transaction: { Account: 'rp8rJYTpodf8qbSCHVTNacf8nSW8mRakFw', Fee: '12000', Flags: 2147614720, LastLedgerSequence: 11412350, LimitAmount: { currency: 'TST', issuer: 'rfXK4fN2AAqH7H5Uo94JQwT88qQkv69pqR', value: '541'}, Memos: [{ Memo: { MemoFormat: '7274312E322E312D3234392D67323830353539302D64697274792D6465627567202D2048454144', 'MemoType': '636C69656E74'}}], Sequence: 53, SigningPubKey: '023DF3A034F5C7F4FE9F247ECCD7ABAC5DC3F2819F3C62AD9B9D2E9690DBAA84EB', TransactionType: 'TrustSet', TxnSignature: '3044022043D7C2F7256819CE61D3F22658A452116A7FC9919B01A07F4C937AD660C976C2022076E3090C3861A9F6FC9758FCA03270213579AF1F0F97D922F9AE46E5C4F46BFB', date: 475897740, hash: '72B496AF54ECD1D6E8B8BA91931BB2A99FD541835B5668F9AA2095BF97BB8352'}, type: 'transaction', validated: true};

  it('should parse incoming trust line right', function(done) {
    var tx = rewriter.processTxn(data.transaction, data.meta, account);
    expect(tx).to.be.an('object');
    expect(tx.transaction).to.be.an('object');
    expect(tx.transaction.type).to.equal('trusted');
    expect(tx.transaction.currency).to.equal('TST');
    expect(tx.transaction.counterparty).to.equal('rp8rJYTpodf8qbSCHVTNacf8nSW8mRakFw');
    expect(tx.effects).to.be.an.instanceof(Array);
    expect(tx.effects).to.have.length(1);
    expect(tx.effects[0].type).to.equal('trust_create_remote');
    expect(tx.effects[0].currency).to.equal('TST');
    expect(tx.effects[0].noRipple).to.be.true;
    assert.equal(tx.effects[0].limit.to_number(), 0);
    assert.equal(tx.effects[0].limit_peer.to_number(), 541);

    done();
  });
});
