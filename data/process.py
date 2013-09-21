version = ['mlp', 'rbf']

for v in version:
    r = open(v + 'totals.csv', 'r')
    arr = []
    nans = []
    saturation = []

    i = 0
    for line in r:
        if i > 0:
            vals = line.split(',')
            l = []
            arr_to_add = arr
            if vals[0] == 'NaN':
                arr_to_add = nans

            elif float(vals[0]) > 5 or float(vals[0]) < -5:
                arr_to_add = saturation

            for val in vals:
                if val == 'false' or val == 'true':
                    l.append(bool(val))
                else:
                    l.append(float(val))
            arr_to_add.append(l)
        else:
            i += 1

    INPUTS = 3
    out = {
        '2': [],
        '4': [],
        '6': []
    }

    # sort by dim
    for line in arr:
        dim = str(int(line[INPUTS]))
        out[dim].append(line)

    for k in out:
        f = open('./post_process/' + v + 'total' + k + '.csv', 'w+')

        for line in out[k]:
            f.write(','.join(str(x) for x in line) + '\n')

