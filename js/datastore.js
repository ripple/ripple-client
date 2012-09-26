var dataStoreOptions = [];

dataStoreOptions['RPCDataStore'] = {};

dataStoreOptions['RPCDataStore'].save = function (key, value) {
  rpc.data_store(key, value);
};

dataStoreOptions['RPCDataStore'].load = function (key, callback) {
  rpc.data_store(key, value);
};

dataStoreOptions['RPCDataStore'].delete = function (key) {
  rpc.data_delete(key);
};
