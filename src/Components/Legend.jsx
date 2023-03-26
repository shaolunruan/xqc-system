import React, { useState, useEffect, useRef  } from 'react';
import axios from 'axios'
import * as d3 from 'd3'

import {colorMap_circle_border, colorMap_point, colorMap_circle_fill} from "../function/view1_colorScheme";
import {view1_colorScheme} from "../function/view1_colorScheme";
import {state_Light, state_light, state_dark, state_color_point} from "../function/color_scheme";


function Legend(props){


    const param_algo = props.param_algo




    //定义是否mount的ref
    const didMount = useRef(false)

    // 数据存这儿
    let data = useRef({})






    function render_legend(data){


        // 统计所有出现的states，e.g., ['00', '01', '10', '11']
        let all_states = Object.values(data).reduce((arr, d)=>{

            Object.values(d).forEach(d0=>{

                Object.values(d0['hubs']).forEach(_d=>{
                    Object.values(_d['states']).forEach(__d=>{
                        if(!arr.includes(__d['state'])){
                            arr.push(__d['state'])
                        }
                    })
                })
            })

            return arr

        }, [])
            .sort()// 按 ['00', '01', '10', '11'] 这样的顺序排序




        function generateStates(n){
            var states = [];

            // Convert to decimal
            var maxDecimal = parseInt("1".repeat(n),2);

            // For every number between 0->decimal
            for(var i = 0; i <= maxDecimal; i++){
                // Convert to binary, pad with 0, and add to final results
                states.push(i.toString(2).padStart(n,'0'));
            }

            return states;
        }


        // all_states = ['101','000','110', '111', '001', '011', '100' ].sort()

        let power = all_states[0].length

        let entire_states = generateStates(power).sort()

        // console.log(entire_states)


        /////////////// 定义一些变量 ///////////////

        const svg_width = 300, svg_height = 100
        const cell_width_height = 30
        const legend_padding_left = 30, legend_padding_top = 20
        const gap = 3


        const row_num = 2, column_num = all_states.length / row_num



        // 创建 svg 画布
        let svg = d3.select('#legend_container')
            .append('svg')
            .attr('width', svg_width)
            .attr('height', svg_height)
            .attr('class', `legend_svg`)




        // 检查 all_states 的个数是不是 2的n次方
        // if(!Number.isInteger(Math.log2(all_states.length))){
        //
        //     console.log('State number is not the power of 2')
        //
        //     return
        // }



        // 把 ['000', '001', '010', '011', '100', '101', '110', '111'] 分成上下两层
        let each_row = d3.range(Math.pow(2, power-1))

        let arr = [0,1]

            arr = arr.map(i=>{

            return each_row.map(d=>d+i * Math.pow(2, power-1))
        })






        ///////////// 画代表每个 state 的小cell //////////////


        let legend_g = svg.append('g')
            .attr('class', 'legend_states')
            .attr('transform', `translate(${legend_padding_left}, ${legend_padding_top})`)



        legend_g.selectAll('.null')
            .data(arr)
            .join('g')
            .attr('transform', (d,i)=>`translate(${0}, ${i * (cell_width_height+gap)})`)
            .selectAll('.null')
            .data(d=>d)
            .join('rect')
            .attr('x', (d,i)=>i * (cell_width_height+gap))
            .attr('y', 0)
            .attr('width', cell_width_height)
            .attr('height', cell_width_height)
            // .each(d=>{
            //     console.log(d)
            // })
            .attr('fill', index=>all_states.includes(entire_states[index])? Object.values(state_light)[index]: '#ffffff')






        /////////// 添加 label ///////////////
        legend_g.append('g')
            .attr('transform', `translate(${-25}, ${0})`)
            .selectAll('.null')
            .data([`0_`, `1_`])
            .join('text')
            .html(d=>d)
            .attr('transform', (d,i)=>`translate(${0}, ${i*(cell_width_height+gap) + (cell_width_height+gap)/2})`)
            .style('font-size', '1.1em')
            .style('fill', '#000000')




        legend_g.append('g')
            .attr('transform', `translate(${0}, ${0})`)
            .selectAll('.null')
            .data(arr[0].map(d=>`_${entire_states[d].substring(1)}`)) // ['_00', '_01', '_10', '_11']
            .join('text')
            .html(d=>d)
            .attr('transform', (d,i)=>`translate(${i*(cell_width_height+gap) }, ${-5})`)
            .style('font-size', '1.1em')
            .style('fill', '#000000')









    }





    // 获取数据然后调用 render_legend 函数画图
    function get_data_and_render(){

        let file_name = param_algo


        // 画 OriginCircuit
        axios.get(`data/${file_name}.json`)
            // axios.get(`data/temp.json`)
            .then(res=>{

                data.current = res.data

                render_legend(data.current)
            })
    }



    // mount 的时候渲染一次
    useEffect(()=>{

        get_data_and_render()

    }, [])



    // 当 algo 更新的时候update
    useEffect(()=>{


        // 跳过第一次 mount
        if(!didMount.current){
            didMount.current = true

            return
        }


        // 删除dandelion chart
        d3.selectAll('.legend_svg')
            .remove()

        get_data_and_render()


    }, [param_algo])





    return (
        <div id="legend_container" style={{
            position: 'absolute',
            top: "93px",
            right: '100px'
        }}></div>

    )

}

export default Legend