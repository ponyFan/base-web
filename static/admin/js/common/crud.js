
/**
 * curd模块，保存前端数据，实现了简单事务管理
 */
define(function (require, exports, module) {
    'use strict';

    /**
     * 数据库类，支持数据库范围内的事务
     * @constructor
     */
    function Database() {
        this.useTransaction = false;
        this.collections = [];
    }

    /**
     * 数据库单例
     * @type {null}
     */
    Database.instance = null;
    /**
     * 获取或者初始化数据库单例
     * @returns {null|Database}
     */
    Database.getInstance = function () {
        if (Database.instance === null) {
            Database.instance = new Database();
        }
        return Database.instance;
    };

    /**
     * 获取数据库中的某个表，不存在则抛出异常
     * @param name
     */
    Database.prototype.collection = function (name) {
        var collection = _.find(this.collections, function (el) {
            return el.name === name;
        });
        if (!collection) {
            throw new Error('collection ' + name + 'exists in this instance.');
        }
        return collection;
    };

    /**
     * 创建数据表，不能在事务中使用，若存在相同名字的数据表则抛出异常
     * @param name
     * @param schema
     * @returns {Collection}
     */
    Database.prototype.create = function (name, schema) {
        if (this.useTransaction) {
            throw new Error('you can create table in transaction.');
        }
        if (_.find(this.collections, function (el) {return el.name === 'name';})) {
            throw new Error('collection ' + name + ' exists in this instance.');
        }
        var collection = new Collection(name, this, schema);
        this.collections.push(collection);
        return collection;
    };

    /**
     * 删除数据表，不能在事务中使用，若存在相同名字的数据表则抛出异常
     * @param name
     */
    Database.prototype.drop = function (name) {
        if (this.useTransaction) {
            throw new Error('you can drop table in transaction.');
        }
        var index = -1;
        this.collections.forEach(function (el, idx) {
            if (el.name === name) {
                index = idx;
            }
        });
        if (index === -1) {
            throw new Error('collection ' + name + ' does not exists in this instance.');
        }
        this.collections.splice(index, 1);
    };

    /**
     * 开始事务，重复开启抛出异常
     */
    Database.prototype.beginTransaction = function () {
        if (this.useTransaction) {
            throw new Error('database is already in transaction.');
        }
        this.useTransaction = true;
    };

    /**
     * 提交事务，事务必须是已经开启的
     */
    Database.prototype.commit = function () {
        if (!this.useTransaction) {
            throw new Error('database is not in transaction.');
        }
        this.useTransaction = false;
        this.collections.forEach(function (el) {
            el.onCommit();
        });
    };

    /**
     * 回滚事务，事务必须是开启的
     */
    Database.prototype.rollback = function () {
        if (!this.useTransaction) {
            throw new Error('database is not in transaction.');
        }
        this.useTransaction = false;
        this.collections.forEach(function (el) {
            el.onRollback();
        });
    };

    /**
     * 数据表的构造函数
     * @param database
     * @param schema
     * @constructor
     */
    function Collection(name, database, schema) {
        this.name = name;
        this.database = database;
        this.autoIncrementIndexes = {};
        var _schema = [], self = this;
        schema.forEach(function (el) {
            var col = {
                name: el.name
            };
            if (el.autoIncrement) {
                self.autoIncrementIndexes[col.name] = -1;
                col.autoIncrement = true;
            }
            _schema.push(col);
        });
        this.schema = _schema;
        this.rows = [];
        this.last_insert_id = null;
    }

    /**
     * 查询数据，返回数组，每一项是符合条件数据的拷贝，比如从a表查询id=1的数据
     * var db = Database.getInstance();
     * db.collection('a').select({id:1});
     * -> [{id: 1, name: 'x'}, {id: 2, name: 'y'}]
     * @param where 查询条件
     * @returns {Array} 结果集合
     */
    Collection.prototype.select = function (where) {
        var rows = [], db = this.database;
        this.rows.forEach(function (row) {
            if (_.isMatch(row.local, where)) {
                rows.push(_.clone(row.local));
            }
        });
        return rows;
    };

    /**
     * 更新数据
     * @param value
     * @param where
     * @returns {number} 更新的行数
     */
    Collection.prototype.update = function (value, where) {
        var rows = this.selectRow(where), db = this.database;
        rows.forEach(function (row) {
            if (db.useTransaction && row.local === row.remote) {
                row.local = _.clone(row.remote);
            }
            _.keys(value).forEach(function (key) {
                if (!_.has(row.local, key)) {
                    throw new Error('no such column ' + key + ' for update.');
                }
                row.local[key] = value[key];
            });
        });
        return rows.length;
    };

    /**
     * 插入数据
     * @param value
     */
    Collection.prototype.insert = function (value) {
        var self = this, row = {};
        this.schema.forEach(function (col) {
            var v;
            if (!_.has(value, col.name)) {
                if (col.autoIncrement) {
                    v = self.autoIncrementIndexes[col.name];
                    self.last_insert_id = v;
                    self.autoIncrementIndexes[col.name]--;
                } else {
                    throw new Error('can not find value for column ' + col.name);
                }
            } else {
                v = value[col.name];
            }
            row[col.name] = v;
        });
        var r = {local: row, remote: null};
        if (!this.database.useTransaction) {
            r.remote = r.local;
        }
        this.rows.push(r);
    };

    /**
     * 删除数据
     * @param where
     * @returns {number} 删除的行数
     */
    Collection.prototype.delete = function (where) {
        var rows = this.selectRow(where), db = this.database, self = this;
        if (!db.useTransaction) {
            rows.forEach(function (row, idx) {
                self.rows.splice(self.rows.indexOf(row), 1);
            });
        } else {
            rows.forEach(function (row, idx) {
                row.local = null;
                if (row.remote === null) {
                    self.rows.splice(self.rows.indexOf(row), 1);
                }
            });
        }
        return rows.length;
    };

    /**
     * 加载数据，和insert不同的是，如此插入的数据不会回滚
     */
    Collection.prototype.load = function (value) {
        var self = this, row = {};
        this.schema.forEach(function (col) {
            var v;
            if (!_.has(value, col.name)) {
                if (col.autoIncrement) {
                    v = self.autoIncrementIndexes[col.name];
                    self.last_insert_id = v;
                    self.autoIncrementIndexes[col.name]--;
                } else {
                    throw new Error('can not find value for column ' + col.name);
                }
            } else {
                v = value[col.name];
            }
            row[col.name] = v;
        });
        this.rows.push({local: row, remote: row});
    };

    /**
     * 获取所有本地更新的行的拷贝
     * @returns {Array}
     */
    Collection.prototype.getLocalUpdatedRows = function () {
        var rows = [];
        this.rows.forEach(function (row) {
            if (row.local !== null && row.remote !== null && row.local !== row.remote) {
                rows.push(_.clone(row.local));
            }
        });
        return rows;
    };

    /**
     * 获取所有本地添加的行的拷贝
     * @returns {Array}
     */
    Collection.prototype.getLocalInsertedRows =function () {
        var rows = [];
        this.rows.forEach(function (row) {
            if (row.remote === null) {
                rows.push(_.clone(row.local));
            }
        });
        return rows;
    };

    /**
     * 获取所有本地删除的行的拷贝
     * @returns {Array}
     */
    Collection.prototype.getLocalDeletedRows = function () {
        var rows = [];
        this.rows.forEach(function (row) {
            if (row.local === null) {
                rows.push(_.clone(row.remote));
            }
        });
        return rows;
    };

    /**
     * 返回最近插入数据生成的id
     * @returns {number}
     */
    Collection.prototype.lastInsertId = function () {
        return this.last_insert_id;
    };

    /**
     * 选择数据行的辅助函数
     * @private
     * @param where
     * @returns {Array}
     */
    Collection.prototype.selectRow = function (where) {
        var rows = [];
        this.rows.forEach(function (row) {
            if (_.isMatch(row.local, where)) {
                rows.push(row);
            }
        });
        return rows;
    };

    /**
     * 当数据库commit时的回调函数
     * @private
     */
    Collection.prototype.onCommit = function () {
        this.rows = this.rows.filter(function (row) {
            if (row.local) {
                row.remote = row.local;
            }
            return row.local;
        });
    };

    /**
     * 当数据库rollback时的回调函数
     * @private
     */
    Collection.prototype.onRollback = function () {
        this.rows = this.rows.filter(function (row) {
            if (row.remote) {
                row.local = row.remote;
            }
            return row.remote;
        });
    };

    /**
     * 最后只导出Database类
     * @type {Database}
     */
    exports.Database = Database;

});
