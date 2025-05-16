local inv = require("inv")
local ui = require("ui")

---@type { [string]: number }
local fuelValues = {}

---@param fuelRequirement integer
local function refuel(fuelRequirement)
  local fuelLevel = turtle.getFuelLevel()
  if fuelLevel == "unlimited" or fuelLevel >= fuelRequirement then return end
  ---@cast fuelLevel integer

  while true do
    for slot = 1, 16 do
      local itemDetail = turtle.getItemDetail(slot)
      if itemDetail then
        inv.select(slot)

        local itemName = itemDetail.name
        local fuelValue = fuelValues[itemName]
        if fuelValue == nil then
          if turtle.refuel(1) then
            local newFuelLevel = turtle.getFuelLevel() --[[@as integer]]
            fuelValue = newFuelLevel - fuelLevel
            fuelLevel = newFuelLevel
          else
            fuelValue = 0
          end
          fuelValues[itemName] = fuelValue
        end

        if fuelValue > 0 then
          local itemsNeeded =
            math.ceil((fuelRequirement - fuelLevel) / fuelValue)
          if turtle.getItemCount(slot) >= itemsNeeded then
            turtle.refuel(itemsNeeded)
            fuelLevel = turtle.getFuelLevel() --[[@as integer]]
          end
        end
      end
    end

    local requiredFuel = fuelRequirement - turtle.getFuelLevel()
    if requiredFuel <= 0 then return end

    ui.clear()
    print("Please add fuel to the turtle: " .. requiredFuel)
    sleep(1)
  end
end

local function assertFuel()
  local fuelLevel = turtle.getFuelLevel()
  if fuelLevel == "unlimited" then return end
  if fuelLevel <= 0 then error("No fuel left") end
end

local function forward()
  local needsClear = false
  while not turtle.forward() do
    print("Failed to move forward")
    assertFuel()
    needsClear = true
    turtle.attack()
  end
  if needsClear then ui.clear() end
end

local function up()
  local needsClear = false
  while not turtle.up() do
    print("Failed to move up")
    assertFuel()
    needsClear = true
    turtle.attackUp()
  end
  if needsClear then ui.clear() end
end

local function down()
  local needsClear = false
  while not turtle.down() do
    print("Failed to move down")
    assertFuel()
    needsClear = true
    turtle.attackDown()
  end
  if needsClear then ui.clear() end
end

local function back()
  local needsClear = false
  while not turtle.back() do
    print("Failed to move back")
    assertFuel()
    needsClear = true
    turtle.turnLeft()
    turtle.turnLeft()
    while turtle.attack() do
      -- attack
    end
    turtle.turnLeft()
    turtle.turnLeft()
  end
  if needsClear then ui.clear() end
end

local function turnLeft()
  turtle.turnLeft()
end

local function turnRight()
  turtle.turnRight()
end

---@param itemName string
local function place(itemName)
  inv.selectWait(itemName)

  local needsClear = false
  while not turtle.place() do
    print("Failed to place")
    needsClear = true
    turtle.attack()
  end
  if needsClear then ui.clear() end
end

---@param itemName string
local function placeUp(itemName)
  inv.selectWait(itemName)

  local needsClear = false
  while not turtle.placeUp() do
    print("Failed to placeUp")
    needsClear = true
    turtle.attackUp()
  end
  if needsClear then ui.clear() end
end

---@param itemName string
local function placeDown(itemName)
  inv.selectWait(itemName)

  local needsClear = false
  while not turtle.placeDown() do
    print("Failed to placeDown")
    needsClear = true
    turtle.attackDown()
  end
  if needsClear then ui.clear() end
end

---@param json string
local function complex(json)
  local params = textutils.unserialiseJSON("[" .. json) --[[@as table]]
  local command = table.remove(params, 1)
  if command == "redstone" then
    redstone.setAnalogOutput(params[1], params[2])
  else
    error("Unknown complex command: " .. command)
  end
end

local tokenHandlers = {
  ["+"] = forward,
  ["-"] = back,
  ["^"] = up,
  ["v"] = down,
  ["<"] = turnLeft,
  [">"] = turnRight,
  [":"] = place,
  ["'"] = placeUp,
  [","] = placeDown,
  ["["] = complex,
}

---@param script string
local function execute(script)
  local lines = script:gmatch("([^\r\n]+)")
  for line in lines do
    local firstChar = line:sub(1, 1)
    local handler = tokenHandlers[firstChar]
    if not handler then error("No handler for token: " .. firstChar) end

    if #line > 1 then
      handler(line:sub(2))
    else
      handler()
    end
  end
end

return {
  refuel = refuel,
  resupply = inv.resupply,
  dumpInventory = inv.dumpInventory,
  execute = execute,
  clear = ui.clear,
}
