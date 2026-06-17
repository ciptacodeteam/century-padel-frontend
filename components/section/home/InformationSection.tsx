import { Button } from "@/components/ui/button";
import { DoorOpen, HandPlatter, ShowerHead, ShowerHeadIcon, SquareParking, TableCellsMerge, Toilet, TowerControl, Wifi } from "lucide-react";

export default function InfoSection() {
    return (
        <>
            <section>
                <div className="mx-auto lg:max-w-7xl w-11/12 pb-24 lg:pb-0">

                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <span className="w-1 lg:h-16 h-12 bg-primary me-6"></span>
                            <p className="text-primary lg:text-2xl text-base font-semibold w-2/3">Discover the Perfect Padel Venue <span className="text-black">for Your Next Match</span></p>
                        </div>
                    </div>

                    <div className="lg:grid grid-cols-3 lg:my-12 my-8 lg:gap-4">
                        <div className="lg:col-span-2">
                            <div className="w-full bg-red-100">
                                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3982.071906991455!2d98.66272857514763!3d3.570932950414765!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x303131596859861d%3A0xb4ba229de265ef33!2sCentury%20Padel!5e0!3m2!1sid!2sid!4v1781684219243!5m2!1sid!2sid" height="380" loading="lazy" className="w-full"></iframe>
                            </div>
                        </div>

                        <div className="border border-gray-200 p-6">
                            <h1 className="font-semibold mb-2 text-xl">Premium Facilities</h1>

                            <div className="mt-6 flex flex-col gap-4">
                                <div className="flex gap-4">
                                    <TableCellsMerge className="text-primary"/>
                                    <p className="text-gray-600">6 Padel Courts</p>
                                </div>

                                <div className="flex gap-4">
                                    <HandPlatter className="text-primary"/>
                                    <p className="text-gray-600">Cafe & Resto</p>
                                </div>

                                <div className="flex gap-4">
                                    <SquareParking className="text-primary"/>
                                    <p className="text-gray-600">Parking</p>
                                </div>

                                <div className="flex gap-4">
                                    <DoorOpen className="text-primary"/>
                                    <p className="text-gray-600">Fitting Room</p>
                                </div>

                                <div className="flex gap-4">
                                    <Toilet className="text-primary"/>
                                    <p className="text-gray-600">Toilet</p>
                                </div>

                                <div className="flex gap-4">
                                    <Wifi className="text-primary"/>
                                    <p className="text-gray-600">Wifi</p>
                                </div>

                                <div className="flex gap-4">
                                    <ShowerHeadIcon className="text-primary"/>
                                    <p className="text-gray-600">Shower</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}