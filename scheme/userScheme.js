// userScheme.js

const userRoleList = [
    ["count", "CUInt"],
    ["id", "UInt32"],
    ["name", "String"]
];

const exp_log = [
    ["length", "CUInt"],
    ["tid", "UInt32"],
    ["time", "UInt32"],
    ["result", "UByte"],
    ["volume", "UByte"],
    ["cost", "UInt32"]
];

const autolock = [
    ["length", "CUInt"],
    ["key", "UInt32"],
    ["value", "UInt32"],
];

const forbidden = [
    ["length", "CUInt"],
    ["type", "UByte"],
    ["time", "UInt32"],
    ["created_time", "UInt32"],
    ["reason", "String"],
];

const itemScheme = [
	[ "length", "CUInt" ],
	[ "id", "UInt32" ],
	[ "pos", "UInt32" ],
	[ "count", "UInt32" ],
	[ "max_count", "UInt32" ],
	[ "data", "Octets" ],
	[ "proctype", "UInt32" ],
	[ "expire_date", "UInt32" ],
	[ "guid1", "UInt32" ],
	[ "guid2", "UInt32" ],
	[ "mask", "UInt32" ]			
];

const GRoleInventory = [
    ["id", "UInt32"],
    ["pos", "UInt32"],
    ["count", "UInt32"],
    ["max_count", "UInt32"],
    ["data", "Octets"],
    ["proctype", "UInt32"],
    ["expire_date", "UInt32"],
    ["guid1", "UInt32"],
    ["guid2", "UInt32"],
    ["mask", "UInt32"],
]

exports.userRoleListScheme = {
    protocol: {
        port: 29400,
        request: 0x0d49,
        response: "8d49"
    },
    misc: [
        ["ret_code", "UInt32"],
    ],
    base: [
        ["roles", ["Array", userRoleList]]
    ]
};

// exports.getRoleScheme = {
// 	protocol: {
// 		port: 29400,
// 		request: 0xBC5,
// 		response: "9f42"
// 	},	
// 	misc: [
// 		[ "ret_code", "UInt32" ],
// 	],	
// 	base: [
// 		[ "version", "UByte" ],
// 		[ "id", "UInt32" ],
// 		[ "name", "String" ],
// 		[ "race", "UInt32" ],
// 		[ "cls", "UInt32" ],
// 		[ "gender", "UByte" ],
// 		[ "custom_data", "Octets" ],
// 		[ "config_data", "Octets" ],
// 		[ "custom_stamp", "UInt32" ],
// 		[ "status", "UByte" ],
// 		[ "delete_time", "UInt32" ],
// 		[ "create_time", "UInt32" ], //Epoch
// 		[ "lastlogin_time", "UInt32" ],
// 		[ "forbidden", ["Array", forbidden] ],
// 		[ "help_states", "Octets" ],
// 		[ "spouse", "UInt32" ],
// 		[ "user_id", "UInt32" ],
// 		[ "cross_data", "Octets" ],
// 		[ "reserved2", "UByte" ],
// 		[ "reserved3", "UByte" ],
// 		[ "reserved4", "UByte" ],
// 	]
// };

exports.getRoleScheme = {
    protocol: {
		port: 29400,
		request: 0x1f43,
		response: "9f43"
	},	
	misc: [
		[ "ret_code", "UInt32" ],
	],	
	base: [
		[ "version", "UByte" ],
		[ "id", "UInt32" ],
		[ "name", "String" ],
		[ "race", "UInt32" ],
		[ "cls", "UInt32" ],
		[ "gender", "UByte" ],
		[ "custom_data", "Octets" ],
		[ "config_data", "Octets" ],
		[ "custom_stamp", "UInt32" ],
		[ "status", "UByte" ],
		[ "delete_time", "UInt32" ],
		[ "create_time", "UInt32" ],
		[ "lastlogin_time", "UInt32" ],
		[ "forbidden", ["Array", forbidden] ],
		[ "help_states", "Octets" ],
		[ "spouse", "UInt32" ],
		[ "user_id", "UInt32" ],
		[ "cross_data", "Octets" ],
		[ "reserved2", "UByte" ],
		[ "reserved3", "UByte" ],
		[ "reserved4", "UByte" ]
	],
	status: [
		[ "version", "CUInt" ],
		[ "level", "UInt32" ],
		[ "culti", "UInt32" ],
		[ "exp", "UInt32" ],
		[ "sp", "UInt32" ],
		[ "pp", "UInt32" ],
		[ "hp", "UInt32" ],
		[ "mp", "UInt32" ],
		[ "pos_x", "Float" ],
		[ "pos_y", "Float" ],
		[ "pos_z", "Float" ],
		[ "map", "UInt32" ],
		[ "pk_status", "UInt32" ],
		[ "pk_time", "UInt32" ],
		[ "hero_time", "UInt32" ],
		[ "reputation", "UInt32" ],
		[ "custom_status", "Octets" ],
		[ "filter_data", "Octets" ],
		[ "charactermode", "Octets" ],
		[ "instancekeylist", "Octets" ],
		[ "dbltime_expire", "UInt32" ],
		[ "dbltime_mode", "UInt32" ],
		[ "dbltime_begin", "UInt32" ],
		[ "dbltime_used", "UInt32" ],
		[ "dbltime_max", "UInt32" ],
		[ "time_used", "UInt32" ],
		[ "dbltime_data", "Octets" ],
		[ "storesize", "UInt16" ],
		[ "petcorral", "Octets" ],
		[ "property", "Octets" ],
		[ "var_data", "Octets" ],
		[ "skills", "Octets" ],
		[ "storehousepasswd", "Octets" ],
		[ "waypointlist", "Octets" ],
		[ "coolingtime", "Octets" ],
		[ "npc_relation", "Octets" ],
		[ "multi_exp_ctrl", "Octets" ],
		[ "storage_task", "Octets" ],
		[ "guild_contrib", "Octets" ],
		[ "force_data", "Octets" ],
		[ "online_award", "Octets" ],
		[ "profit_time_data", "Octets" ],
		[ "country_data", "Octets" ],
		[ "king_data", "Octets" ],
		[ "meridian_data", "Octets" ],
		[ "extraprop", "Octets" ],
		[ "title_data", "Octets" ],
		[ "reincarnation_data", "Octets" ],
		[ "realm_data", "Octets" ],
		[ "reserved2", "UByte" ],
		[ "reserved3", "UByte" ],
	],
	inventory: [
		[ "capacity", "UInt32" ],
		[ "timestamp", "UInt32" ],
		[ "gold", "UInt32" ],
		[ "items", ["Array", itemScheme, ['inventory', 'capacity']] ],
		[ "reserved1", "UInt32" ],
		[ "reserved2", "UInt32" ],				
	],
	equipments: [
		[ "items", ["Array", itemScheme] ]
	],
	banker: [
		[ "capacity", "UInt32" ],
		[ "gold", "UInt32" ],
        [ "itemsSize", "CUInt"],
		[ "items", ["Array", itemScheme ] ],
        [ "size1", "UByte" ],
        [ "size2", "UByte" ],
		[ "fashion_capacity", "CUInt"], 
        [ "materials_capacity", "CUInt"],
        // [ "fashions", ["Array", itemScheme ] ],
       
		// [ "materials", ["Array", itemScheme ] ],
        // [ "size3", "UByte"],
        // [ "generalCardSize", "UByte"],
        // [ "cards", ["Array", itemScheme]],

	],
    // cards: [
    //     [ "cardCap", "UByte" ],
    //     [ "items", ["Array", itemScheme]],
    // ],
	// tasks: [
	// 	[ "reserved", "UInt32" ],
	// 	[ "task_data", "Octets" ],
	// 	[ "task_complete", "Octets" ],
	// 	[ "task_finishtime", "Octets" ],
	// 	[ "items", ["Array", itemScheme] ]
	// ]
};

exports.putRoleScheme = Object.assign({}, this.getRoleScheme, {
    protocol:{
        port: 29400,
        request: 0x1f42,
        response: "9f42"
    }
});



exports.userInfoScheme = {
    protocol: {
        port: 29400,
        request: 0x0bba,
        response: "8bba"
    },
    misc: [
        ["ret_code", "UInt32"],
    ],
    info: [
        ["role_id", "UInt32"],
        ["logicuid", "UInt32"],
        ["cash", "UInt32"],
        ["money", "UInt32"],
        ["cash_add", "UInt32"],
        ["cash_buy", "UInt32"],
        ["cash_sell", "UInt32"],
        ["cash_used", "UInt32"],
        ["add_serial", "UInt32"],
        ["use_serial", "UInt32"],
        ["exp_log", ["Array", exp_log]],
        ["addiction", "Octets"],
        ["cash_password", "Octets"],
        ["autolock", ["Array", autolock]],
        ["status", "UByte"],
        ["forbidden", ["Array", forbidden]],
        ["reference", "Octets"],
        ["consume_reward", "Octets"],
        ["task_counter", "Octets"],
        ["cash_sysauction", "Octets"],
        ["login_record", "Octets"],
        ["mall_consumption", "Octets"],
    ]
};
