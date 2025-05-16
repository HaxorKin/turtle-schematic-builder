local ui = require("ui")

---@param slot ccTweaked.turtle.turtleSlot
local function select(slot)
  if slot ~= turtle.getSelectedSlot() then turtle.select(slot) end
end

---@param itemName string
local function selectItem(itemName)
  if not itemName:find(":") then itemName = "minecraft:" .. itemName end
  for slot = 1, 16 do
    local itemDetail = turtle.getItemDetail(slot)
    if itemDetail and itemDetail.name == itemName then
      select(slot)
      return true
    end
  end
  return false
end

---@param itemName string
local function selectWait(itemName)
  local needsClear = false
  while not selectItem(itemName) do
    print("Please provide " .. itemName)
    needsClear = true
    sleep(1)
  end
  if needsClear then ui.clear() end
end

---@class InventoryManager
---@field inventories { [string]: boolean }
---@field bufferInventory ccTweaked.peripheral.Inventory
local InventoryManager = {}
InventoryManager.__index = InventoryManager

---@param inventories ccTweaked.peripheral.Inventory[]
function InventoryManager.new(inventories)
  local self = setmetatable({}, InventoryManager)

  ---@type { [string]: boolean }
  local inventorySet = {}
  for _, inventory in ipairs(inventories) do
    inventorySet[peripheral.getName(inventory)] = true
  end
  self.inventories = inventorySet

  self:_electBufferInventory()

  return self
end

local function hasEmptySlot(direction)
  local list = peripheral.call(direction, "list")
  local size = peripheral.call(direction, "size")
  return #list < size
end

---@param direction string
local function clearFirstSlot(direction)
  if not peripheral.getType(direction) == "inventory" then return false end

  local inventory = peripheral.wrap(direction) --[[@as ccTweaked.peripheral.Inventory]]

  local firstEmptySlot = nil
  for slot = 1, inventory.size() do
    if not inventory.getItemDetail(slot) then
      firstEmptySlot = slot
      break
    end
  end

  if firstEmptySlot then
    if firstEmptySlot ~= 1 then
      inventory.pushItems(direction, 1, nil, firstEmptySlot)
    end
    return true
  end
  return false
end

function InventoryManager:_tryToElectBufferInventory()
  local inventories = self.inventories

  local potentialDirections = {
    "bottom",
    "front",
    "top",
  }

  for _, direction in ipairs(potentialDirections) do
    if
      inventories[direction]
      and hasEmptySlot(direction)
      and clearFirstSlot(direction)
    then
      self.bufferInventory = peripheral.wrap(direction) --[[@as ccTweaked.peripheral.Inventory]]
      return true
    end
  end

  return false
end

function InventoryManager:_electBufferInventory()
  local needsClear = false
  while not self:_tryToElectBufferInventory() do
    print("Please provide an inventory I can use with at least one empty slot")
    needsClear = true
    sleep(1)
  end
  if needsClear then ui.clear() end
end

---@param inventory string
---@param slot integer
---@param limit integer
function InventoryManager:suckSlot(inventory, slot, limit)
  local bufferInventory = self.bufferInventory
  local itemCount = bufferInventory.pullItems(inventory, slot, limit, 1)
  if itemCount == 0 then return 0 end

  local inventoryName = peripheral.getName(bufferInventory)
  if inventoryName == "front" then
    turtle.suck()
  elseif inventoryName == "top" then
    turtle.suckUp()
  elseif inventoryName == "bottom" then
    turtle.suckDown()
  else
    error("Invalid inventory direction " .. inventoryName)
  end

  return itemCount
end

---@param direction string
local function dump(direction)
  local inventory = peripheral.wrap(direction)
  assert(inventory, "Inventory not found")

  for slot = 1, 16 do
    if turtle.getItemCount(slot) > 0 then
      if inventory.size() < #inventory.list() + 2 then return false end

      select(slot)

      if direction == "front" then
        turtle.drop()
      elseif direction == "top" then
        turtle.dropUp()
      elseif direction == "bottom" then
        turtle.dropDown()
      else
        error("Invalid direction " .. direction)
      end
    end
  end

  return true
end

function InventoryManager:dumpAll()
  local inventories = self.inventories

  local potentialDirections = {
    "top",
    "front",
    "bottom",
  }

  while true do
    for _, direction in ipairs(potentialDirections) do
      if inventories[direction] and dump(direction) then return end
    end

    ui.clear()
    print("Please clear the turtle's inventory")
    sleep(1)
  end
end

---@class ItemsTable
---@field [string] integer
local ItemsTable = {}
ItemsTable.__index = ItemsTable

function ItemsTable.new()
  local instance = setmetatable({}, ItemsTable) --[[@as ItemsTable]]
  return instance
end

---@param itemCounts { [string]: integer }
function ItemsTable.fromItemCounts(itemCounts)
  local instance = ItemsTable.new()
  for itemName, count in pairs(itemCounts) do
    if itemName:find(":") then
      instance[itemName] = count
    else
      instance["minecraft:" .. itemName] = count
    end
  end
  return instance
end

---@param itemName string
---@param by integer
function ItemsTable:decrement(itemName, by)
  local currentCount = self[itemName]
  assert(currentCount, "ItemsTable: Item not found")
  if currentCount > by then
    self[itemName] = currentCount - by
  elseif currentCount == by then
    self[itemName] = nil
  else
    error("ItemsTable: Not enough items to decrement")
  end
end

function ItemsTable:isComplete()
  for _, count in pairs(self) do
    if count > 0 then return false end
  end
  return true
end

---@param from string
---@param items ItemsTable
function InventoryManager:pullItems(from, items)
  if items:isComplete() then return end

  local inventory = peripheral.wrap(from)
  assert(inventory, "Inventory not found")

  for slot = 1, inventory.size() do
    local itemDetail = inventory.getItemDetail(slot)
    if itemDetail then
      local itemName = itemDetail.name
      local neededItems = items[itemName]
      if neededItems then
        local suckedCount = self:suckSlot(from, slot, neededItems)
        items:decrement(itemName, suckedCount)
      end
    end
  end
end
---@param items ItemsTable
function InventoryManager:tryToResupply(items)
  for inventory in pairs(self.inventories) do
    self:pullItems(inventory, items)
  end
end

---@param itemCounts { [string]: integer }
local function resupply(itemCounts)
  local items = ItemsTable.fromItemCounts(itemCounts)
  local needsClear = false

  while true do
    local inventories = { peripheral.find("inventory") } --[[@as ccTweaked.peripheral.Inventory[] ]]
    if #inventories == 0 then
      print("No connected inventories found")
      needsClear = true
    else
      local inventoryManager = InventoryManager.new(inventories)
      inventoryManager:tryToResupply(items)
      if items:isComplete() then break end

      ui.clear()
      print(
        "Please add the following items to one of the connected inventories:"
      )
      for item, count in pairs(items) do
        if count > 0 then
          if item:find("^minecraft:") then item = item:sub(11) end
          print(item .. ": " .. count)
        end
      end
      needsClear = true
    end
    sleep(1)
  end

  if needsClear then ui.clear() end
end

local function dumpInventory()
  InventoryManager.new({ peripheral.find("inventory") }):dumpAll()
end

return {
  select = select,
  selectWait = selectWait,
  resupply = resupply,
  dumpInventory = dumpInventory,
}
