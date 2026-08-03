"""Fix pixel arrays: ensure exactly 48 rows of exactly 48 chars each."""
import re

filepath = r"D:\ai\beast\src\renderer\src\utils\pixel-animal.ts"
with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

def fix_pixels_block(match):
    """Fix a pixels: [...] block to have exactly 48 rows of 48 chars."""
    content = match.group(0)
    # Find the array content between [ and ]
    bracket_start = content.index('[')
    # Find matching ]
    depth = 0
    bracket_end = bracket_start
    in_str = False
    for i in range(bracket_start, len(content)):
        ch = content[i]
        if ch == "'" and (i == 0 or content[i-1] != '\\'):
            in_str = not in_str
        if not in_str:
            if ch == '[':
                depth += 1
            elif ch == ']':
                depth -= 1
                if depth == 0:
                    bracket_end = i
                    break

    # Extract pixel rows from the current content
    rows = []
    for line in content[:bracket_end+1].split('\n'):
        m = re.match(r"\s*'([^']*)',?\s*$", line)
        if m:
            row = m.group(1)
            if len(row) < 48:
                row = row.ljust(48, '.')
            elif len(row) > 48:
                row = row[:48]
            rows.append(row)

    # Pad to exactly 48 rows
    while len(rows) < 48:
        rows.append('.' * 48)
    rows = rows[:48]

    # Build new array
    lines = ['[\n']
    for i, row in enumerate(rows):
        comma = ',' if i < 47 else ''
        lines.append(f"      '{row}'{comma}\n")
    lines.append('    ]')

    # Return the prefix (pixels:) plus the fixed array
    prefix = content[:bracket_start]
    return prefix + ''.join(lines)

# Find and fix all pixels blocks
# Pattern: find "pixels:" followed by an array
def find_pixels_blocks(text):
    """Generator yielding (start, end) of each pixels: [...] block."""
    i = 0
    while True:
        idx = text.find('pixels:', i)
        if idx == -1:
            break
        # Find opening bracket
        bracket_start = text.index('[', idx)
        # Find matching closing bracket
        depth = 0
        bracket_end = bracket_start
        in_str = False
        for j in range(bracket_start, len(text)):
            ch = text[j]
            if ch == "'" and (j == 0 or text[j-1] != '\\'):
                in_str = not in_str
            if not in_str:
                if ch == '[':
                    depth += 1
                elif ch == ']':
                    depth -= 1
                    if depth == 0:
                        bracket_end = j
                        break
        yield (idx, bracket_end + 1)
        i = bracket_end + 1

# Collect all blocks in reverse order (so we can replace without invalidating indices)
blocks = list(find_pixels_blocks(text))
print(f"Found {len(blocks)} pixels blocks")

# Replace from end to start
for start, end in reversed(blocks):
    block = text[start:end]
    fixed = fix_pixels_block(block)
    text = text[:start] + fixed + text[end:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)

print("Done! Fixed all pixel arrays.")

# Verify
with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# Check interface is intact
assert 'pixels: string[]' in text, "Interface declaration broken!"
print("Interface declaration OK")

# Count rows in each pixel array
blocks2 = list(find_pixels_blocks(text))
print(f"Blocks after fix: {len(blocks2)}")
for idx, (start, end) in enumerate(blocks2):
    block = text[start:end]
    rows = [l for l in block.split('\n') if re.match(r"\s*'[^']*',?\s*$", l)]
    if len(rows) != 48:
        print(f"  Block {idx}: {len(rows)} rows (BAD)")
    else:
        all_48 = all(len(re.match(r"\s*'([^']*)'", r).group(1)) == 48 for r in rows)
        if not all_48:
            print(f"  Block {idx}: 48 rows but some wrong width!")

print("Verification complete!")
